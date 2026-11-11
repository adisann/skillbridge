import argparse
import asyncio
import logging
import sys
from datetime import datetime, timezone
from typing import Optional

# Muat environment variables
try:
    from dotenv import load_dotenv
    load_dotenv("worker/.env")
    load_dotenv(".env")
    load_dotenv("web/.env.local")
except ImportError:
    pass

from worker.sources import (
    GreenhouseSource,
    LeverSource,
    LinkedInSource,
    JobstreetSource,
    GlintsSource,
    SeedSource,
    JobSource
)
from worker.pipeline import (
    clean_html_text,
    compute_content_hash,
    Deduplicator,
    extract_job_details_rule_based,
    get_embedding_provider,
    normalize_skills_list,
    SupabaseStorage
)
from worker.pipeline.description import usable_description

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("worker.main")


def get_source_by_name(source_name: str, limit: int = 25) -> JobSource:
    name = source_name.lower().strip()
    if name == "greenhouse":
        return GreenhouseSource()
    elif name == "lever":
        return LeverSource()
    elif name == "linkedin":
        return LinkedInSource(limit=limit)
    elif name == "jobstreet":
        return JobstreetSource(limit=limit)
    elif name == "glints":
        return GlintsSource(limit=limit)
    elif name == "seed":
        return SeedSource()
    else:
        raise ValueError(f"Sumber tidak dikenal: '{source_name}'. Pilihan: greenhouse, lever, linkedin, jobstreet, glints, seed.")


async def run_worker(source_name: str, limit: int = 15):
    logger.info(f"=== Menjalankan Worker SkillBridge: source={source_name}, limit={limit} ===")
    
    source = get_source_by_name(source_name, limit=limit)
    storage = SupabaseStorage()
    deduplicator = Deduplicator()
    embedder = get_embedding_provider()

    # Muat taksonomi alias skill dari Supabase
    taxonomy_aliases = storage.get_all_skills_and_aliases()
    
    # Muat hash data tersimpan di Supabase untuk deduplikasi lintas run
    existing_jobs = storage.get_existing_jobs(source.name)
    if source.name == "linkedin":
        existing_jobs.update(storage.get_existing_jobs("jobstreet"))
    logger.info(f"Ditemukan {len(existing_jobs)} lowongan tersimpan di Supabase untuk sumber '{source.name}' (termasuk fallback).")

    fetched_count = 0
    inserted_count = 0
    updated_count = 0
    duplicate_count = 0
    failed_count = 0
    status = "success"
    error_msg = None
    retrieval_method = getattr(source, "name", "public_api")
    if retrieval_method in ("linkedin", "jobstreet"):
        retrieval_method = "jobspy"
    elif retrieval_method == "seed":
        retrieval_method = "seed"
    else:
        retrieval_method = "public_api"

    try:
        raw_jobs = await source.fetch_jobs(limit=limit)
        fetched_count = len(raw_jobs)
        logger.info(f"Berhasil fetch {fetched_count} lowongan mentah dari {source.name}.")

        for raw in raw_jobs:
            try:
                # 1. Clean HTML / teks
                cleaned_desc = clean_html_text(raw.description_raw)
                if not usable_description(cleaned_desc):
                    failed_count += 1
                    logger.warning("Deskripsi %s belum tersedia; lewati item dan pertahankan data tersimpan.", raw.external_id)
                    continue

                # 2. Hitung Content Hash
                content_hash = compute_content_hash(raw.title, raw.company, cleaned_desc)

                # 3. Cek Deduplikasi Lintas Run (Run ke-2: Lewati AI jika hash sama)
                if raw.external_id in existing_jobs and existing_jobs[raw.external_id] == content_hash:
                    logger.info(
                        f"[Deduplikasi] Lowongan '{raw.title}' ({raw.external_id}) sudah ada dan tidak berubah. "
                        f"Melewati ekstraksi AI & embedding."
                    )
                    duplicate_count += 1
                    continue

                # 4. Cek Deduplikasi Dalam Run yang Sama
                if deduplicator.is_duplicate(raw.source_name, raw.external_id, content_hash):
                    logger.info(f"[Deduplikasi In-Memory] Duplikat ditemukan: {raw.source_name} - {raw.external_id}. Melewati.")
                    duplicate_count += 1
                    continue

                # 5. Extract Structured Job Details (Hanya dijalankan untuk data baru / berubah)
                details = extract_job_details_rule_based(raw.title, cleaned_desc)

                # 6. Normalize Skills & Tagging
                hinted_required = [h["name"] for h in raw.skill_hints if h.get("must_have")]
                hinted_preferred = [h["name"] for h in raw.skill_hints if not h.get("must_have")]
                norm_required = normalize_skills_list(
                    details.required_skills + hinted_required, custom_aliases=taxonomy_aliases
                )
                norm_preferred = normalize_skills_list(
                    [s for s in details.preferred_skills + hinted_preferred if s not in hinted_required],
                    custom_aliases=taxonomy_aliases,
                )

                # 7. Embedding Vector
                embedding_text = f"{details.canonical_title} {raw.company} {' '.join(norm_required)} {cleaned_desc[:500]}"
                vector = await embedder.get_embedding(embedding_text)

                # 8. Siapkan Record Lowongan
                is_update = raw.external_id in existing_jobs
                job_record = {
                    "source_name": raw.source_name,
                    "external_id": raw.external_id,
                    "source_url": raw.source_url,
                    "title": raw.title,
                    "canonical_title": details.canonical_title,
                    "company": raw.company,
                    "location": raw.location or "Indonesia",
                    "employment_type": raw.employment_type or "Full-time",
                    "seniority": details.seniority,
                    "experience_years_min": (
                        raw.experience_years_min
                        if raw.experience_years_min is not None
                        else details.experience_years_min
                    ),
                    "education": raw.education_level or details.education,
                    "min_gpa": details.min_gpa,
                    "salary_min": raw.salary_min,
                    "salary_max": raw.salary_max,
                    "salary_currency": raw.salary_currency,
                    "salary_period": raw.salary_period,
                    "expires_at": raw.expires_at.isoformat() if raw.expires_at else None,
                    "description": cleaned_desc,
                    "content_hash": content_hash,
                    "retrieval_method": raw.retrieval_method,
                    "retrieved_at": datetime.now(timezone.utc).isoformat(),
                    "is_active": True,
                    "embedding": vector
                }

                # 9. Simpan ke Supabase (jobs dan job_skills)
                await storage.upsert_job_with_skills(
                    job_record=job_record,
                    required_skills=norm_required,
                    preferred_skills=norm_preferred
                )

                if is_update:
                    updated_count += 1
                    logger.info(f"Berhasil memperbarui lowongan: {raw.title} ({raw.company})")
                else:
                    inserted_count += 1
                    logger.info(f"Berhasil menyimpan lowongan baru: {raw.title} ({raw.company})")

                existing_jobs[raw.external_id] = content_hash

            except Exception as item_err:
                failed_count += 1
                logger.error(f"Gagal memproses item {raw.external_id}: {item_err}")
                # Isolasi kegagalan: satu item gagal tidak boleh menghentikan item lain

    except Exception as run_err:
        status = "failed"
        error_msg = str(run_err)
        logger.error(f"Worker run gagal fatal: {run_err}")

    if fetched_count > 0 and failed_count == fetched_count:
        status = "failed"
        error_msg = error_msg or "Semua item gagal diproses; data lowongan tersimpan dipertahankan."

    # Catat audit eksekusi ke tabel `worker_runs`
    await storage.log_worker_run(
        source_name=source_name,
        retrieval_method=retrieval_method,
        status=status,
        fetched=fetched_count,
        inserted=inserted_count,
        updated=updated_count,
        duplicate=duplicate_count,
        failed=failed_count,
        error_message=error_msg
    )

    logger.info(
        f"=== Worker {source_name} Selesai [{status}] ==="
        f" Fetched: {fetched_count}, Inserted: {inserted_count}, Updated: {updated_count}, "
        f" Duplicate: {duplicate_count}, Failed: {failed_count}"
    )


async def run_all_sources(limit: int = 10):
    """Menjalankan seluruh sumber secara berurutan dengan isolasi kegagalan."""
    sources = ["greenhouse", "lever", "linkedin", "glints"]
    logger.info(f"Menjalankan multi-source worker untuk: {sources}")
    for src in sources:
        try:
            await run_worker(source_name=src, limit=limit)
        except Exception as e:
            logger.error(f"Sumber {src} gagal, namun melanjutkan sumber lain: {e}")


def main():
    parser = argparse.ArgumentParser(description="SkillBridge Automated Job Worker")
    parser.add_argument("--source", type=str, default="greenhouse", help="Pilihan: greenhouse, lever, linkedin, jobstreet, glints, seed, all")
    parser.add_argument("--limit", type=int, default=10, help="Jumlah lowongan maksimal yang diambil")
    parser.add_argument("--export-seed", action="store_true", help="Ekspor database lowongan Supabase menjadi file seed JSON")

    args = parser.parse_args()

    if args.export_seed:
        storage = SupabaseStorage()
        storage.export_jobs_to_seed()
        return

    if args.source.lower() == "all":
        asyncio.run(run_all_sources(limit=args.limit))
    else:
        asyncio.run(run_worker(source_name=args.source, limit=args.limit))


if __name__ == "__main__":
    main()
