import asyncio
import html
import logging
import re
from typing import Any, Optional

import httpx
from bs4 import BeautifulSoup, Tag
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from .base import JobSource, RawJob

logger = logging.getLogger(__name__)

# Nama tampilan perusahaan bila API tidak mengirim `company_name`
BOARD_DISPLAY_NAMES = {
    "binance": "Binance",
    "cloudflare": "Cloudflare",
    "gitlab": "GitLab",
    "canonical": "Canonical",
}

# Nilai `location.name` di Greenhouse yang sebenarnya tipe kerja, bukan tempat
WORKPLACE_TYPES = {"hybrid", "remote", "on-site", "onsite", "in-office", "in office", "office"}

# Bagian profil perusahaan / penutup yang sama di semua lowongan board (bukan isi lowongan)
_BOILERPLATE_HEADING = re.compile(
    r"^(?:about us|about the company|what makes [\w .&-]+ special\??|why join us\??|"
    r"our commitment to diversity|equal (?:employment )?opportunity)",
    re.IGNORECASE,
)
_BOILERPLATE_PARAGRAPH = re.compile(
    r"equal opportunity employer|reasonable accommodations?|export control laws|"
    r"aa/veterans/disabled|regardless of race|without regard to (?:their|race)",
    re.IGNORECASE,
)
_AVAILABLE_LOCATIONS = re.compile(r"^\s*(?:available\s+)?locations?\s*:\s*(.+)$", re.IGNORECASE)


def _heading_text(el: Tag) -> Optional[str]:
    """Teks elemen bila ia berfungsi sebagai judul bagian (h1–h6 atau <p><strong>…</strong></p>)."""
    if el.name in {"h1", "h2", "h3", "h4", "h5", "h6"}:
        return el.get_text(" ", strip=True)
    if el.name == "p":
        strong = el.find(["strong", "b"])
        text = el.get_text(" ", strip=True)
        if strong and strong.get_text(" ", strip=True) == text and len(text) <= 80:
            return text
    return None


def _is_boilerplate_heading(title: str, company: str) -> bool:
    if _BOILERPLATE_HEADING.match(title):
        return True
    # "About Cloudflare" = profil perusahaan; "About the Team/Role" tetap disimpan
    return bool(company) and title.strip().rstrip(":").lower() == f"about {company.lower()}"


def tidy_greenhouse_content(content: str, company: str = "") -> tuple[str, list[str]]:
    """Ambil inti lowongan dari HTML Greenhouse.

    - Membuka HTML yang di-escape oleh API (&lt;p&gt;).
    - Membuang blok intro/penutup (`content-intro`, `content-conclusion`) serta bagian
      "About Us", "What Makes X Special?", dan paragraf EEO yang sama di semua lowongan.
    - Memindahkan baris "Available Locations: …" ke daftar lokasi.
    Mengembalikan (html_bersih, daftar_lokasi).
    """
    if not content:
        return "", []
    if re.search(r"&lt;/?[a-z]", content, re.IGNORECASE):
        content = html.unescape(content)
    soup = BeautifulSoup(content, "html.parser")

    for el in soup.select(".content-intro, .content-conclusion"):
        el.decompose()

    locations: list[str] = []
    for p in soup.find_all("p"):
        match = _AVAILABLE_LOCATIONS.match(p.get_text(" ", strip=True))
        if match:
            locations = [loc.strip() for loc in re.split(r"[;,/|]| or ", match.group(1)) if loc.strip()]
            p.decompose()
            break

    # Buang judul boilerplate beserta isi di bawahnya sampai judul berikutnya
    for el in list(soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p"])):
        if el.decomposed:
            continue
        title = _heading_text(el)
        if not title or not _is_boilerplate_heading(title, company):
            continue
        parent = el.parent
        siblings = [el]
        for sib in el.find_next_siblings():
            sib_title = _heading_text(sib)
            if sib_title and not _is_boilerplate_heading(sib_title, company):
                break
            siblings.append(sib)
        for sib in siblings:
            sib.decompose()
        # Wadah yang tinggal kosong ikut dibuang
        if isinstance(parent, Tag) and parent.name == "div" and not parent.get_text(strip=True):
            parent.decompose()

    for p in list(soup.find_all(["p", "li"])):
        if not p.decomposed and _BOILERPLATE_PARAGRAPH.search(p.get_text(" ", strip=True)):
            p.decompose()

    return str(soup), locations


def format_location(api_location: str, page_locations: list[str]) -> tuple[str, bool]:
    """Gabungkan lokasi dari isi lowongan dengan `location.name` API.

    Contoh: API "Hybrid" + isi "Available Locations: London" -> "London (Hybrid)".
    """
    api_location = (api_location or "").strip()
    workplace = api_location if api_location.lower() in WORKPLACE_TYPES else ""
    place = ", ".join(page_locations) if page_locations else ("" if workplace else api_location)
    is_remote = "remote" in api_location.lower() or "remote" in place.lower()
    if place and workplace:
        return f"{place} ({workplace})", is_remote
    return place or workplace or "Remote / Unspecified", is_remote


def parse_pay_range(job: dict[str, Any]) -> dict[str, Any]:
    """Rentang gaji dari `pay_input_ranges` (aktif dengan ?pay_transparency=true)."""
    ranges = job.get("pay_input_ranges") or []
    if not ranges:
        return {}
    first = ranges[0]
    min_cents, max_cents = first.get("min_cents"), first.get("max_cents")
    if min_cents is None and max_cents is None:
        return {}
    return {
        "salary_min": int(min_cents) // 100 if min_cents is not None else None,
        "salary_max": int(max_cents) // 100 if max_cents is not None else None,
        "salary_currency": (first.get("currency_type") or "").upper() or None,
        "salary_period": "year",  # Greenhouse menampilkan rentang tahunan
    }


class GreenhouseSource(JobSource):
    """Pengambil data lowongan kerja dari Greenhouse Public Board API."""
    name = "greenhouse"

    def __init__(self, boards: list[str] | None = None, timeout: float = 15.0):
        # Default verified tech companies with active analytics/BI postings
        self.boards = boards or ["binance", "cloudflare", "gitlab", "canonical"]
        self.timeout = timeout

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        reraise=False
    )
    async def _fetch_board_jobs(self, client: httpx.AsyncClient, board: str) -> list[dict[str, Any]]:
        url = f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs?content=true&pay_transparency=true"
        try:
            resp = await client.get(url)
            if resp.status_code in (401, 403):
                logger.warning(f"Greenhouse board '{board}' akses ditolak (HTTP {resp.status_code}). Melewati.")
                return []
            if resp.status_code == 429 or resp.status_code >= 500:
                resp.raise_for_status()
            if resp.status_code == 200:
                data = resp.json()
                return data.get("jobs", [])
            return []
        except httpx.HTTPStatusError as e:
            if e.response.status_code >= 500 or e.response.status_code == 429:
                raise
            logger.warning(f"Error fetching greenhouse board '{board}': {e}")
            return []

    @staticmethod
    def to_raw_job(job: dict[str, Any], board: str) -> RawJob:
        """Petakan satu objek lowongan API Greenhouse ke RawJob."""
        job_id = str(job.get("id", ""))
        company = (job.get("company_name") or "").strip() or BOARD_DISPLAY_NAMES.get(board, board.capitalize())
        content, page_locations = tidy_greenhouse_content(job.get("content", ""), company)
        location, is_remote = format_location((job.get("location") or {}).get("name", ""), page_locations)

        return RawJob(
            external_id=job_id,
            source_name="greenhouse",
            source_url=job.get("absolute_url") or f"https://job-boards.greenhouse.io/{board}/jobs/{job_id}",
            title=(job.get("title") or "").strip(),
            company=company,
            location=location,
            is_remote=is_remote,
            description_raw=content,
            retrieval_method="public_api",
            metadata={
                "board": board,
                "updated_at": job.get("updated_at"),
                "first_published": job.get("first_published"),
            },
            **parse_pay_range(job),
        )

    async def fetch_jobs(self, limit: int = 25) -> list[RawJob]:
        results: list[RawJob] = []
        headers = {
            "Accept": "application/json",
            "User-Agent": "SkillBridgeWorker/1.0 (+https://skillbridge.id/bot)"
        }

        async with httpx.AsyncClient(timeout=self.timeout, headers=headers) as client:
            for board in self.boards:
                if len(results) >= limit:
                    break
                logger.info(f"Mengambil lowongan dari Greenhouse board: {board}")
                raw_jobs = await self._fetch_board_jobs(client, board)
                await asyncio.sleep(1.0)  # Santun: 1 detik delay per host/board

                for job in raw_jobs or []:
                    if len(results) >= limit:
                        break
                    title = job.get("title", "")
                    # Filter role prioritas: Data Analyst / BI Analyst
                    if not any(role in title.lower() for role in ["data", "analyst", "intelligence", "analytics"]):
                        continue
                    results.append(self.to_raw_job(job, board))

        logger.info(f"Greenhouse selesai: {len(results)} lowongan didapatkan.")
        return results
