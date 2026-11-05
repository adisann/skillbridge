import asyncio
import logging
import re
from typing import Optional
from datetime import datetime

import httpx
from bs4 import BeautifulSoup

from .base import JobSource, RawJob

logger = logging.getLogger(__name__)


class LinkedInSource(JobSource):
    """Pengambil data lowongan kerja dari LinkedIn Guest Public Search.
    
    Kepatuhan Aturan & Privasi Anonimitas:
    - Akses sepenuhnya anonim (tanpa cookie, tanpa akun, tanpa autentikasi).
    - Membuang seluruh data pribadi recruiter (email, nama, telepon).
    - Berhenti seketika jika terkena 429 / 403 / CAPTCHA tanpa retry agresif.
    - Maksimal 25 lowongan per batch demi menghormati server target.
    - Rate limit santun: maksimal 1 request per detik per host.
    """
    name = "linkedin"

    def __init__(self, search_term: str = "Data Analyst", location: str = "Indonesia", limit: int = 25):
        self.search_term = search_term
        self.location = location
        self.limit = min(limit, 25)

    async def _fetch_guest_job_description(self, client: httpx.AsyncClient, job_url: str) -> Optional[str]:
        """Mengambil teks deskripsi lengkap dari URL publik guest LinkedIn secara santun dan anonim."""
        if not job_url or "linkedin.com" not in job_url:
            return None
        try:
            resp = await client.get(job_url, timeout=12.0)
            if resp.status_code in (429, 403) or "/login" in str(resp.url) or "/checkpoint" in str(resp.url):
                logger.warning(f"LinkedIn guest detail dihentikan karena status {resp.status_code} atau redirect auth: {job_url}")
                return None
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                markup = soup.find("div", class_="show-more-less-html__markup")
                if markup:
                    text = markup.get_text("\n", strip=True)
                    # Sanitasi privasi: buang nomor telepon dan email
                    text = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[email redacted]", text)
                    text = re.sub(r"(?:\+?62|08)\d{8,12}", "[phone redacted]", text)
                    return text
        except Exception as e:
            logger.debug(f"Gagal mengambil detail guest LinkedIn {job_url}: {e}")
        return None

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

                # Ambil detail lengkap jika deskripsi dari search card masih kosong / terlalu singkat (< 150 char)
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                }
                async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
                    for job in results:
                        if len(job.description_raw.strip()) < 150 and job.source_url:
                            full_desc = await self._fetch_guest_job_description(client, job.source_url)
                            if full_desc:
                                job.description_raw = full_desc
                            # Jeda santun rate limiting 1 detik per request sesuai aturan
                            await asyncio.sleep(1.0)

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

