import logging
from typing import Optional
from datetime import datetime

from .base import JobSource, RawJob

logger = logging.getLogger(__name__)


class LinkedInSource(JobSource):
    """Pengambil data lowongan kerja dari LinkedIn Guest Public Search.
    
    Kepatuhan Aturan & Privasi Anonimitas:
    - Akses sepenuhnya anonim (tanpa cookie, tanpa akun, tanpa autentikasi).
    - Membuang seluruh data pribadi recruiter (email, nama, telepon).
    - Berhenti seketika jika terkena 429 / 403 / CAPTCHA tanpa retry agresif.
    - Maksimal 25 lowongan per batch demi menghormati server target.
    """
    name = "linkedin"

    def __init__(self, search_term: str = "Data Analyst", location: str = "Indonesia", limit: int = 25):
        self.search_term = search_term
        self.location = location
        self.limit = min(limit, 25)

    async def fetch_jobs(self, limit: Optional[int] = None) -> list[RawJob]:
        limit_to_fetch = min(limit or self.limit, 25)
        results: list[RawJob] = []

        logger.info(f"Memulai LinkedIn Guest Scraper: term='{self.search_term}', loc='{self.location}', limit={limit_to_fetch}")

        try:
            # Gunakan python-jobspy secara anonim (tanpa session cookies)
            from jobspy import scrape_jobs

            jobs_df = scrape_jobs(
                site_name=["linkedin"],
                search_term=self.search_term,
                location=self.location,
                results_wanted=limit_to_fetch,
                country_indeed="indonesia",
                is_remote=False
            )

            if jobs_df is None or jobs_df.empty:
                logger.info("LinkedIn: Tidak ada data atau dibatasi/diblokir secara anonim. Mempersiapkan fallback JobStreet...")
            else:
                for _, row in jobs_df.iterrows():
                    if len(results) >= limit_to_fetch:
                        break

                    job_id = str(row.get("id") or hash(row.get("job_url", "")))
                    title = str(row.get("title") or "")
                    company = str(row.get("company") or "Perusahaan Anonim")
                    location = str(row.get("location") or self.location)
                    description = str(row.get("description") or "")
                    job_url = str(row.get("job_url") or "")

                    # Sanitasi privasi: pastikan tidak ada email atau data kontak personal yang disimpan
                    # Field 'emails' dari jobspy dibuang secara eksplisit sesuai AGENTS.md
                    results.append(RawJob(
                        external_id=job_id,
                        source_name=self.name,
                        source_url=job_url,
                        title=title,
                        company=company,
                        location=location,
                        description_raw=description,
                        retrieval_method="jobspy",
                        employment_type=str(row.get("job_type") or "Full-time"),
                        metadata={
                            "anonymous_scrape": True,
                            "search_term": self.search_term,
                            "location_query": self.location
                        }
                    ))

        except ImportError:
            logger.warning("Modul python-jobspy belum terpasang. Menggunakan mode simulasi / melewati.")
        except Exception as e:
            # Sesuai aturan: berhenti tanpa retry saat menerima 429/403/CAPTCHA, log warning, isolasi error
            logger.warning(f"LinkedIn anonymous scraper dihentikan atau dibatasi server: {e}")

        # Fallback ke JobStreet Indonesia jika LinkedIn tidak menghasilkan lowongan (scrape 10 lowongan)
        if not results:
            logger.info("LinkedIn tidak menghasilkan data (guest rate limit/kosong). Mengaktifkan fallback JobStreet Indonesia (10 lowongan)...")
            try:
                from .jobstreet import JobstreetSource
                fallback_limit = min(limit_to_fetch, 10)
                fallback = JobstreetSource(search_term=self.search_term, limit=fallback_limit)
                results = await fallback.fetch_jobs(limit=fallback_limit)
            except Exception as js_err:
                logger.warning(f"Fallback JobStreet juga gagal: {js_err}")

        logger.info(f"LinkedIn selesai: {len(results)} lowongan didapatkan.")
        return results

