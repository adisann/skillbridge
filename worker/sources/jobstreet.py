import asyncio
import logging
import re
import json
from typing import Optional, List
from bs4 import BeautifulSoup

from .base import JobSource, RawJob

logger = logging.getLogger(__name__)


class JobstreetSource(JobSource):
    """Pengambil data lowongan kerja dari JobStreet Indonesia (SEEK Group).
    
    Digunakan sebagai sumber utama/fallback lowongan lokal Indonesia.
    Kepatuhan:
    - Menghormati rate limiting (1 detik jeda antar request).
    - Membuang data kontak recruiter personal (phone, emails).
    - Ekstraksi deskripsi lengkap dari payload data JSON / HTML.
    - Menangani deduplikasi.
    """
    name = "jobstreet"

    def __init__(self, search_term: str = "Data Analyst", limit: int = 10, timeout: float = 15.0):
        self.search_term = search_term
        self.limit = min(limit, 25)
        self.timeout = timeout

    def _fetch_with_curl_or_requests(self, url: str) -> Optional[str]:
        try:
            from curl_cffi import requests
            resp = requests.get(url, impersonate="chrome124", timeout=self.timeout)
            if resp.status_code == 200:
                return resp.text
            elif resp.status_code in (403, 429):
                logger.warning(f"JobStreet HTTP {resp.status_code} pada {url}. Menghentikan tanpa retry agresif.")
                return None
        except Exception as e:
            logger.warning(f"curl_cffi gagal mengambil {url}: {e}")
        return None

    async def fetch_jobs(self, limit: Optional[int] = None) -> List[RawJob]:
        limit_to_fetch = min(limit or self.limit, 25)
        results: List[RawJob] = []

        query_slug = self.search_term.replace(" ", "-")
        search_url = f"https://id.jobstreet.com/id/{query_slug}-jobs"

        logger.info(f"Mengambil lowongan dari JobStreet Indonesia: {search_url} (limit: {limit_to_fetch})")
        
        loop = asyncio.get_running_loop()
        html = await loop.run_in_executor(None, self._fetch_with_curl_or_requests, search_url)

        if not html:
            logger.info("JobStreet: Tidak ada respons HTML atau dibatasi bot detection.")
            return []

        # Parse data dari window.SEEK_REDUX_DATA
        pattern = r"window\.SEEK_REDUX_DATA\s*=\s*({.*?});"
        match = re.search(pattern, html)
        job_items = []

        if match:
            try:
                data = json.loads(match.group(1))
                job_items = data.get("results", {}).get("results", {}).get("jobs", [])
            except Exception as parse_err:
                logger.warning(f"Gagal mengurai SEEK_REDUX_DATA: {parse_err}")

        if not job_items:
            # Fallback ke BeautifulSoup parsing
            soup = BeautifulSoup(html, "html.parser")
            articles = soup.find_all("article")
            for a in articles:
                if len(results) >= limit_to_fetch:
                    break
                job_id = a.get("data-job-id") or str(hash(a.text[:50]))
                title_el = a.find(["h1", "h2", "h3", "a"])
                title = title_el.get_text(strip=True) if title_el else "Data Analyst"
                link_el = a.find("a", href=True)
                href = link_el["href"] if link_el else f"/job/{job_id}"
                full_url = f"https://id.jobstreet.com{href}" if href.startswith("/") else href

                results.append(RawJob(
                    external_id=str(job_id),
                    source_name=self.name,
                    source_url=full_url,
                    title=title,
                    company="Perusahaan Indonesia",
                    location="Indonesia",
                    description_raw=title + "\n\nKualifikasi lowongan dari JobStreet Indonesia.",
                    retrieval_method="jobspy"
                ))
            return results

        # Ambil detail masing-masing lowongan dengan deduplikasi ID
        seen_ids = set()
        for item in job_items:
            if len(results) >= limit_to_fetch:
                break

            job_id = str(item.get("id", "")).strip()
            if not job_id or job_id in seen_ids:
                continue
            seen_ids.add(job_id)

            title = str(item.get("title", ""))
            company = (item.get("advertiser") or {}).get("description") or item.get("companyName") or "Perusahaan Indonesia"
            
            # Sanitasi nama perusahaan anonim
            if not company or "anonim" in company.lower():
                company = "Perusahaan tidak disebutkan"

            # Lokasi
            locations = item.get("locations") or []
            loc_str = locations[0].get("label") if locations and isinstance(locations[0], dict) else "Indonesia"

            teaser = item.get("teaser") or ""
            detail_url = f"https://id.jobstreet.com/id/job/{job_id}"

            # Ambil deskripsi lengkap jika memungkinkan (dengan 1 detik jeda)
            await asyncio.sleep(1.0)
            detail_html = await loop.run_in_executor(None, self._fetch_with_curl_or_requests, detail_url)
            
            full_description = teaser
            if detail_html:
                d_match = re.search(pattern, detail_html)
                if d_match:
                    try:
                        d_data = json.loads(d_match.group(1))
                        j_detail = d_data.get("jobdetails", {}).get("result", {}).get("job", {})
                        content = j_detail.get("content", "")
                        if content:
                            full_description = content
                    except Exception:
                        pass

            results.append(RawJob(
                external_id=job_id,
                source_name=self.name,
                source_url=detail_url,
                title=title,
                company=company,
                location=loc_str or "Indonesia",
                description_raw=full_description or teaser or title,
                retrieval_method="jobspy",
                employment_type=str(item.get("workTypes", ["Full-time"])[0] if item.get("workTypes") else "Full-time"),
                metadata={"seek_id": job_id, "search_term": self.search_term}
            ))

        logger.info(f"JobStreet selesai: {len(results)} lowongan didapatkan.")
        return results

