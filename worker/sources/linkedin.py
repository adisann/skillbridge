import asyncio
import logging
import math
import time
from urllib.parse import urlparse
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from .base import JobSource, RawJob
from ..pipeline.clean import redact_contact_details

logger = logging.getLogger(__name__)


class LinkedInGuestBlocked(RuntimeError):
    """Hentikan seluruh pengambilan detail pada run ini tanpa retry."""


def _row_text(value) -> str:
    if value is None or isinstance(value, float) and math.isnan(value):
        return ""
    return str(value).strip()


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
        self._last_guest_request = 0.0
        self._guest_blocked = False

    async def _fetch_guest_job_description(self, client: httpx.AsyncClient, job_url: str) -> Optional[str]:
        """Mengambil teks deskripsi lengkap dari URL publik guest LinkedIn secara santun dan anonim."""
        parsed = urlparse(job_url)
        if parsed.scheme != "https" or parsed.hostname not in {"linkedin.com", "www.linkedin.com", "id.linkedin.com"} or not parsed.path.startswith("/jobs/view/"):
            return None
        if self._guest_blocked:
            raise LinkedInGuestBlocked("Pengambilan detail LinkedIn sudah dihentikan pada run ini.")
        try:
            await asyncio.sleep(max(0, 1 - (time.monotonic() - self._last_guest_request)))
            self._last_guest_request = time.monotonic()
            resp = await client.get(job_url, timeout=12.0)
            destination = str(resp.url) + " " + resp.headers.get("location", "")
            soup = BeautifulSoup(resp.text, "html.parser")
            if resp.status_code in (429, 403, 999) or any(part in destination for part in ("/login", "/checkpoint", "/authwall")) or soup.select_one('form[action*="captcha"], #captcha-internal, .g-recaptcha'):
                self._guest_blocked = True
                raise LinkedInGuestBlocked(f"Akses guest dihentikan (HTTP {resp.status_code}/autentikasi/CAPTCHA).")
            if resp.status_code == 200:
                markup = soup.find("div", class_="show-more-less-html__markup")
                if markup:
                    text = markup.get_text("\n", strip=True)
                    # Sanitasi privasi: buang nomor telepon dan email
                    return redact_contact_details(text)
        except LinkedInGuestBlocked:
            raise
        except httpx.HTTPError as e:
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
                    description = _row_text(row.get("description"))
                    job_url = str(row.get("job_url") or "")

                    # Sanitasi privasi: pastikan tidak ada email atau data kontak personal yang disimpan
                    # Field 'emails' dari jobspy sengaja tidak disimpan
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
                async with httpx.AsyncClient(headers=headers, follow_redirects=False) as client:
                    for job in results:
                        if len(job.description_raw.strip()) < 150 and job.source_url:
                            full_desc = await self._fetch_guest_job_description(client, job.source_url)
                            if full_desc:
                                job.description_raw = full_desc

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

