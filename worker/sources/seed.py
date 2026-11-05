import json
import logging
from pathlib import Path
from typing import Optional

from .base import JobSource, RawJob

logger = logging.getLogger(__name__)


SAMPLE_SEED_DATA = [
    {
        "external_id": "seed-da-001",
        "title": "Junior Data Analyst",
        "company": "Nusantara FinTech",
        "location": "Jakarta, Indonesia (Hybrid)",
        "employment_type": "Full-time",
        "source_url": "https://example.com/jobs/seed-da-001",
        "description_raw": """
        Kami mencari Junior Data Analyst untuk bergabung dengan tim Analytics & Growth kami.
        
        Tanggung Jawab:
        - Mengumpulkan, membersihkan, dan memvalidasi data transaksi harian.
        - Membangun dashboard visualisasi performa produk keuangan.
        - Melakukan query data menggunakan SQL untuk kebutuhan ad-hoc tim produk.
        
        Persyaratan Wajib:
        - Menguasai SQL (PostgreSQL / BigQuery) untuk querying & aggregasi data.
        - Mahir menggunakan Microsoft Excel (VLOOKUP, Pivot Table, Index Match).
        - Kemampuan visualisasi data dengan Tableau atau Power BI.
        - Kemampuan komunikasi bahasa Indonesia dan Inggris yang baik.
        
        Persyaratan Tambahan / Nilai Plus:
        - Pengalaman dasar pemrograman Python (Pandas, NumPy).
        - Pemahaman dasar statistik dan A/B testing.
        - Pengalaman kerja 1 tahun di bidang data analytics (Fresh graduate dipersilakan melamar).
        """
    },
    {
        "external_id": "seed-da-002",
        "title": "Business Intelligence (BI) Analyst",
        "company": "Karya Logistik Express",
        "location": "Bandung, Indonesia (Onsite)",
        "employment_type": "Full-time",
        "source_url": "https://example.com/jobs/seed-da-002",
        "description_raw": """
        Karya Logistik membuka lowongan Business Intelligence Analyst untuk optimasi rute dan biaya operasional.
        
        Kualifikasi Utama:
        - Minimal 2 tahun pengalaman sebagai BI Analyst atau Data Analyst.
        - Sangat mahir SQL tingkat lanjut (window functions, query optimization).
        - Pengalaman mendalam membuat data model dan dashboard di Power BI atau Metabase.
        - Kemampuan menerjemahkan kebutuhan bisnis menjadi KPI metrik yang actionable.
        
        Kualifikasi Tambahan:
        - Kemampuan Python atau R untuk analisis prediktif.
        - Pengalaman dengan data warehouse (Snowflake atau Google BigQuery).
        - Gelar Sarjana di bidang Sistem Informasi, Statistika, Informatika, atau Matematika.
        """
    },
    {
        "external_id": "seed-da-003",
        "title": "Lead Data Analyst",
        "company": "Asia Commerce Global",
        "location": "Jakarta, Indonesia (Remote)",
        "employment_type": "Full-time",
        "source_url": "https://example.com/jobs/seed-da-003",
        "description_raw": """
        Looking for a Senior / Lead Data Analyst to lead our merchant analytics squad.
        
        Requirements:
        - 5+ years of relevant experience in product/commercial data analysis.
        - Expert in SQL, Python data manipulation, and DBT.
        - Proven track record with Looker or Tableau enterprise deployments.
        - Strong business acumen and stakeholder management skills.
        - Minimum Bachelor's Degree in Quantitative field.
        """
    }
]


class SeedSource(JobSource):
    """Sumber data fallback offline untuk demo tanpa ketergantungan koneksi jaringan."""
    name = "seed"

    def __init__(self, seed_file_path: Optional[str] = None):
        self.seed_file_path = seed_file_path

    async def fetch_jobs(self, limit: int = 25) -> list[RawJob]:
        results: list[RawJob] = []

        raw_list = SAMPLE_SEED_DATA
        if self.seed_file_path and Path(self.seed_file_path).exists():
            try:
                with open(self.seed_file_path, "r", encoding="utf-8") as f:
                    raw_list = json.load(f)
            except Exception as e:
                logger.error(f"Gagal memuat seed file '{self.seed_file_path}': {e}. Memakai default.")

        for item in raw_list[:limit]:
            results.append(RawJob(
                external_id=item["external_id"],
                source_name=self.name,
                source_url=item["source_url"],
                title=item["title"],
                company=item["company"],
                location=item["location"],
                description_raw=item["description_raw"],
                retrieval_method="seed",
                employment_type=item.get("employment_type", "Full-time"),
                metadata={"is_demo_seed": True}
            ))

        logger.info(f"Seed source selesai: {len(results)} lowongan dimuat.")
        return results

