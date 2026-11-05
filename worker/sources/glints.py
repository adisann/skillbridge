import asyncio
import json
import logging
import random
import re
from datetime import date, datetime
from typing import Optional

import httpx

from .base import JobSource, RawJob

logger = logging.getLogger(__name__)

BASE_URL = "https://glints.com"
USER_AGENT = "SkillBridgeBot/1.0 (proyek kompetisi mahasiswa; hanya halaman publik)"
NEXT_DATA_RE = re.compile(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.DOTALL)
JOB_URL_RE = re.compile(r"<loc>(https://glints\.com/id/en/opportunities/jobs/[^<]+)</loc>")
SITEMAP_RE = re.compile(r"<loc>(https://glints\.com/sitemap_job_id_\d+\.xml)</loc>")

EMPLOYMENT_TYPES = {
    "FULL_TIME": "Full-time",
    "PART_TIME": "Part-time",
    "CONTRACT": "Contract",
    "INTERNSHIP": "Internship",
    "PROJECT_BASED": "Freelance",
    "FREELANCE": "Freelance",
    "DAILY_WORKER": "Freelance",
}
EDUCATION_LEVELS = {
    "HIGH_SCHOOL": "High School",
    "DIPLOMA": "Diploma",
    "BACHELOR_DEGREE": "Bachelor",
    "MASTER_DEGREE": "Master",
    "DOCTORATE": "Doctorate",
}
SALARY_PERIODS = {"HOUR": "hour", "DAY": "day", "WEEK": "week", "MONTH": "month", "YEAR": "year"}
WORK_ARRANGEMENT_LABELS = {"HYBRID": "Hybrid", "REMOTE": "Remote"}


def _draft_to_text(raw: Optional[str]) -> str:
    """Ubah deskripsi Draft.js (JSON) milik Glints menjadi teks biasa dengan bullet."""
    try:
        doc = json.loads(raw or "")
    except (TypeError, ValueError):
        return ""
    lines: list[str] = []
    for block in doc.get("blocks", []):
        text = (block.get("text") or "").strip()
        if not text:
            if lines and lines[-1] != "":
                lines.append("")
            continue
        is_list = block.get("type") in ("unordered-list-item", "ordered-list-item")
        lines.append(f"• {text}" if is_list else text)
    return "\n".join(lines).strip()


def _redact_contacts(text: str) -> str:
    text = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[email redacted]", text)
    return re.sub(r"(?:\+?62|08)\d{8,12}", "[phone redacted]", text)


def _parse_salary(data: dict) -> tuple[Optional[int], Optional[int], Optional[str], Optional[str]]:
    """Ambil gaji pokok (BASIC) bila ditampilkan; bonus/komisi tidak dihitung."""
    if not data.get("shouldShowSalary"):
        return None, None, None, None
    for item in data.get("salaries") or []:
        if item.get("salaryType") != "BASIC" or item.get("CurrencyCode") != "IDR":
            continue
        period = SALARY_PERIODS.get(str(item.get("salaryMode") or "").upper())
        low = int(item.get("minAmount") or 0) or None
        high = int(item.get("maxAmount") or 0) or None
        if period and (low or high):
            if low and high and low > high:
                low, high = high, low
            return low, high, "IDR", period
    return None, None, None, None


def _parse_location(data: dict) -> str:
    """Susun 'Kota, Provinsi' dari hierarki lokasi Glints, plus penanda Hybrid/Remote."""
    location = data.get("location") or {}
    levels = {location.get("administrativeLevelName"): location.get("name")}
    for parent in location.get("parents") or []:
        levels.setdefault(parent.get("administrativeLevelName"), parent.get("name"))
    parts = [p for p in (levels.get("City") or levels.get("District"), levels.get("Province")) if p]
    label = ", ".join(dict.fromkeys(parts)) or "Indonesia"
    arrangement = WORK_ARRANGEMENT_LABELS.get(str(data.get("workArrangementOption") or "").upper())
    if not arrangement and data.get("isRemote"):
        arrangement = "Remote"
    return f"{label} ({arrangement})" if arrangement else label


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def parse_glints_job(html: str, url: str) -> Optional[RawJob]:
    """Urai satu halaman lowongan Glints (data __NEXT_DATA__) menjadi RawJob. None bila tidak layak."""
    match = NEXT_DATA_RE.search(html)
    if not match:
        return None
    try:
        data = json.loads(match.group(1))["props"]["pageProps"]["initialData"]["data"]
    except (KeyError, TypeError, ValueError):
        return None

    if data.get("status") != "OPEN" or data.get("closedAt"):
        return None
    if (data.get("country") or {}).get("code") not in (None, "ID"):
        return None

    description = _redact_contacts(_draft_to_text(data.get("descriptionJsonString")))
    if not data.get("id") or not data.get("title") or not description:
        return None

    salary_min, salary_max, salary_currency, salary_period = _parse_salary(data)
    skill_hints = [
        {"name": item["skill"]["name"], "must_have": bool(item.get("mustHave"))}
        for item in data.get("skills") or []
        if (item.get("skill") or {}).get("name")
    ]
    min_years = data.get("minYearsOfExperience")

    return RawJob(
        external_id=str(data["id"]),
        source_name="glints",
        source_url=url,
        title=str(data["title"]).strip(),
        company=((data.get("company") or {}).get("name") or "Perusahaan (Glints)").strip(),
        location=_parse_location(data),
        description_raw=description,
        retrieval_method="public_page",
        posted_at=_parse_datetime(data.get("createdAt")),
        expires_at=_parse_datetime(data.get("expiryDate")),
        employment_type=EMPLOYMENT_TYPES.get(str(data.get("type") or "").upper(), "Full-time"),
        is_remote=str(data.get("workArrangementOption") or "").upper() == "REMOTE" or bool(data.get("isRemote")),
        salary_min=salary_min,
        salary_max=salary_max,
        salary_currency=salary_currency,
        salary_period=salary_period,
        education_level=EDUCATION_LEVELS.get(str(data.get("educationLevel") or "").upper()),
        experience_years_min=int(min_years) if isinstance(min_years, (int, float)) else None,
        skill_hints=skill_hints,
    )


class GlintsSource(JobSource):
    """Pengambil lowongan dari halaman publik Glints Indonesia (semua bidang).

    Kepatuhan:
    - Hanya halaman /opportunities/jobs/ yang diizinkan robots.txt; URL dari sitemap resmi.
    - Anonim (tanpa login/cookie), maksimal 25 lowongan per batch, 1 request per detik.
    - Berhenti seketika bila 403/429. Email dan telepon pada deskripsi disensor.
    - Gaji hanya diambil bila lowongan menampilkannya; lowongan tanpa gaji tetap disimpan.
    """
    name = "glints"

    def __init__(self, limit: int = 25, request_delay: float = 1.0):
        self.limit = min(limit, 25)
        self.request_delay = request_delay

    async def _get(self, client: httpx.AsyncClient, url: str) -> Optional[str]:
        resp = await client.get(url, timeout=15.0)
        if resp.status_code in (403, 429):
            raise RuntimeError(f"Glints menolak akses ({resp.status_code}); berhenti tanpa retry.")
        if resp.status_code != 200:
            return None
        return resp.text

    async def _pick_job_urls(self, client: httpx.AsyncClient, want: int) -> list[str]:
        """Pilih URL dari satu sitemap yang berganti tiap hari, diacak stabil per hari."""
        index = await self._get(client, f"{BASE_URL}/sitemap_index.xml")
        sitemaps = SITEMAP_RE.findall(index or "")
        if not sitemaps:
            return []
        today = date.today().toordinal()
        await asyncio.sleep(self.request_delay)
        body = await self._get(client, sitemaps[today % len(sitemaps)])
        urls = list(dict.fromkeys(JOB_URL_RE.findall(body or "")))
        random.Random(today).shuffle(urls)
        return urls[:want]

    async def fetch_jobs(self, limit: Optional[int] = None) -> list[RawJob]:
        limit_to_fetch = min(limit or self.limit, 25)
        results: list[RawJob] = []
        headers = {"User-Agent": USER_AGENT, "Accept-Language": "id,en;q=0.8"}
        logger.info(f"Memulai Glints Scraper: limit={limit_to_fetch}")

        async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
            # Ambil 2x kandidat karena sebagian lowongan sudah ditutup atau bukan di Indonesia
            urls = await self._pick_job_urls(client, limit_to_fetch * 2)
            for url in urls:
                if len(results) >= limit_to_fetch:
                    break
                await asyncio.sleep(self.request_delay)
                try:
                    html = await self._get(client, url)
                except RuntimeError as block_err:
                    logger.warning(str(block_err))
                    break
                except Exception as err:
                    logger.debug(f"Gagal mengambil {url}: {err}")
                    continue
                job = parse_glints_job(html or "", url)
                if job:
                    results.append(job)

        logger.info(f"Glints: {len(results)} lowongan valid dari {len(urls)} URL.")
        return results
