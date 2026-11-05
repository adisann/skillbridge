import os
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Muat variabel lingkungan
try:
    from dotenv import load_dotenv
    load_dotenv("worker/.env")
    load_dotenv(".env")
    load_dotenv("web/.env.local")
except ImportError:
    pass


class SupabaseStorage:
    """Mengelola penyimpanan hasil crawling ke database Supabase secara live."""

    def __init__(self):
        self.supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.client = None
        self._skills_cache: Dict[str, str] = {}  # name.lower() -> id
        self._source_id_cache: Dict[str, str] = {}  # name -> id

        if self.supabase_url and self.service_key and "placeholder" not in self.service_key:
            try:
                from supabase import create_client
                self.client = create_client(self.supabase_url, self.service_key)
                logger.info(f"Supabase client berhasil terhubung ke {self.supabase_url[:28]}...")
            except Exception as e:
                logger.warning(f"Koneksi Supabase gagal: {e}. Worker berjalan dalam mode dry-run/mock.")
        else:
            logger.info("Supabase URL / Service Key tidak terkonfigurasi. Berjalan dalam mode dry-run/mock.")

    def get_source_id(self, source_name: str) -> Optional[str]:
        """Mendapatkan UUID source_id dari tabel `job_sources`."""
        if not self.client:
            return None
        if source_name in self._source_id_cache:
            return self._source_id_cache[source_name]

        try:
            res = self.client.table("job_sources").select("id, name").eq("name", source_name).execute()
            if res.data:
                sid = res.data[0]["id"]
                self._source_id_cache[source_name] = sid
                return sid
        except Exception as e:
            logger.warning(f"Gagal mengambil source_id untuk {source_name}: {e}")
        return None

    def get_existing_jobs(self, source_name: str) -> Dict[str, str]:
        """Mengambil data lowongan tersimpan untuk sumber tertentu (external_id -> content_hash).
        
        Digunakan untuk mendeteksi apakah data lowongan tidak berubah pada run kedua,
        sehingga pipeline dapat melewati ekstraksi AI dan embedding yang berat.
        """
        if not self.client:
            return {}

        try:
            res = self.client.table("jobs").select("external_id, content_hash").eq("source_name", source_name).execute()
            if res.data:
                return {row["external_id"]: row["content_hash"] for row in res.data}
        except Exception as e:
            logger.warning(f"Gagal mengambil existing jobs dari Supabase: {e}")
        return {}

    def get_all_skills_and_aliases(self) -> Dict[str, str]:
        """Memuat seluruh taksonomi skill dan alias dari tabel `skills` & `skill_aliases`."""
        alias_map: Dict[str, str] = {}
        if not self.client:
            return alias_map

        try:
            # Ambil master skills
            s_res = self.client.table("skills").select("id, name").execute()
            if s_res.data:
                for row in s_res.data:
                    self._skills_cache[row["name"].lower()] = row["id"]
                    alias_map[row["name"].lower()] = row["name"]

            # Ambil skill aliases
            a_res = self.client.table("skill_aliases").select("alias, skill_id, skills(name)").execute()
            if a_res.data:
                for row in a_res.data:
                    skill_name = (row.get("skills") or {}).get("name")
                    if skill_name:
                        alias_map[row["alias"].lower()] = skill_name
        except Exception as e:
            logger.warning(f"Gagal memuat taksonomi skill dari Supabase: {e}")

        return alias_map

    async def log_worker_run(
        self,
        source_name: str,
        retrieval_method: str = "public_api",
        status: str = "success",
        fetched: int = 0,
        inserted: int = 0,
        updated: int = 0,
        duplicate: int = 0,
        failed: int = 0,
        error_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Mencatat histori eksekusi worker ke tabel `worker_runs`."""
        run_data = {
            "source_name": source_name,
            "retrieval_method": retrieval_method,
            "status": status,
            "fetched_count": fetched,
            "inserted_count": inserted,
            "updated_count": updated,
            "duplicate_count": duplicate,
            "failed_count": failed,
            "error_message": error_message,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        if self.client:
            try:
                res = self.client.table("worker_runs").insert(run_data).execute()
                return res.data[0] if res.data else run_data
            except Exception as e:
                logger.warning(f"Gagal mencatat worker_runs ke Supabase: {e}")

        logger.info(f"[Audit Worker Run] {run_data}")
        return run_data

    async def upsert_job_with_skills(
        self,
        job_record: Dict[str, Any],
        required_skills: List[str],
        preferred_skills: List[str]
    ) -> str:
        """Melakukan upsert lowongan kerja ke tabel `jobs` dan menghubungkan ke `job_skills`."""
        if not self.client:
            return "simulated_insert"

        source_name = job_record.get("source_name", "")
        source_id = self.get_source_id(source_name)
        if source_id:
            job_record["source_id"] = source_id

        try:
            # 1. Upsert lowongan ke tabel `jobs`
            res = self.client.table("jobs").upsert(
                job_record,
                on_conflict="source_name,external_id"
            ).execute()

            if not res.data:
                # Query job_id yang baru di-upsert
                q = self.client.table("jobs").select("id").eq("source_name", source_name).eq("external_id", job_record["external_id"]).execute()
                job_id = q.data[0]["id"] if q.data else None
            else:
                job_id = res.data[0]["id"]

            if not job_id:
                return "inserted"

            # 2. Hubungkan ke job_skills
            # Skill baru dari sumber lintas bidang (Glints) tidak dilabeli sebagai Data & Analytics
            skill_category = "Umum" if source_name == "glints" else "Data & Analytics"
            all_skills_to_link = [
                (s, True) for s in required_skills
            ] + [
                (s, False) for s in preferred_skills
            ]

            for skill_name, is_mandatory in all_skills_to_link:
                skill_id = await self._ensure_skill_exists(skill_name, category=skill_category)
                if skill_id:
                    try:
                        self.client.table("job_skills").upsert({
                            "job_id": job_id,
                            "skill_id": skill_id,
                            "is_mandatory": is_mandatory,
                            "requirement_snippet": f"Kualifikasi {'wajib' if is_mandatory else 'tambahan'} {skill_name}"
                        }, on_conflict="job_id,skill_id").execute()
                    except Exception as link_err:
                        logger.debug(f"Link job_skills: {link_err}")

            return "inserted"

        except Exception as e:
            logger.error(f"Gagal upsert job {job_record.get('external_id')}: {e}")
            raise

    async def _ensure_skill_exists(self, skill_name: str, category: str = "Data & Analytics") -> Optional[str]:
        """Memastikan skill ada di tabel `skills`, jika belum ada tambahkan secara dinamis."""
        norm_key = skill_name.strip().lower()
        if norm_key in self._skills_cache:
            return self._skills_cache[norm_key]

        if not self.client:
            return None

        try:
            # Cek tabel
            res = self.client.table("skills").select("id").eq("name", skill_name.strip()).execute()
            if res.data:
                sid = res.data[0]["id"]
                self._skills_cache[norm_key] = sid
                return sid

            # Tambahkan jika belum ada
            ins = self.client.table("skills").insert({
                "name": skill_name.strip(),
                "category": category
            }).execute()

            if ins.data:
                sid = ins.data[0]["id"]
                self._skills_cache[norm_key] = sid
                return sid
        except Exception as e:
            logger.debug(f"Skill insert {skill_name}: {e}")

        return None

    def export_jobs_to_seed(self, file_path: str = "worker/sources/jobs_seed.json") -> int:
        """Mengekspor seluruh lowongan aktif dari Supabase ke file JSON untuk seed offline demo."""
        if not self.client:
            logger.warning("Tidak dapat ekspor seed tanpa koneksi Supabase.")
            return 0

        try:
            import json
            res = self.client.table("jobs").select(
                "id, source_name, external_id, source_url, title, canonical_title, company, location, employment_type, seniority, experience_years_min, education, description, content_hash, retrieval_method, is_active, job_skills(is_mandatory, skills(name))"
            ).eq("is_active", True).execute()

            jobs_data = res.data or []
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(jobs_data, f, indent=2, ensure_ascii=False)

            logger.info(f"Berhasil mengekspor {len(jobs_data)} lowongan ke {file_path}")
            return len(jobs_data)
        except Exception as e:
            logger.error(f"Gagal mengekspor seed: {e}")
            return 0
