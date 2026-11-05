import asyncio
import logging
from typing import Any
import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from .base import JobSource, RawJob

logger = logging.getLogger(__name__)


class LeverSource(JobSource):
    """Pengambil data lowongan kerja dari Lever Public Postings API."""
    name = "lever"

    def __init__(self, sites: list[str] | None = None, timeout: float = 15.0):
        # Default verified companies with active BI Analyst and Data Analyst postings
        self.sites = sites or ["everseen", "kwalee", "spotify", "palantir"]
        self.timeout = timeout

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        reraise=False
    )
    async def _fetch_site_postings(self, client: httpx.AsyncClient, site: str) -> list[dict[str, Any]]:
        for base_host in ["api.lever.co", "api.eu.lever.co"]:
            url = f"https://{base_host}/v0/postings/{site}?mode=json&limit=50"
            try:
                resp = await client.get(url)
                if resp.status_code in (401, 403):
                    logger.warning(f"Lever site '{site}' akses ditolak (HTTP {resp.status_code}).")
                    return []
                if resp.status_code == 404 and base_host == "api.lever.co":
                    continue  # Coba api.eu.lever.co
                if resp.status_code == 429 or resp.status_code >= 500:
                    resp.raise_for_status()
                if resp.status_code == 200:
                    return resp.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code >= 500 or e.response.status_code == 429:
                    raise
                logger.warning(f"Error fetching lever site '{site}': {e}")
                return []
        return []

    async def fetch_jobs(self, limit: int = 25) -> list[RawJob]:
        results: list[RawJob] = []
        headers = {
            "Accept": "application/json",
            "User-Agent": "SkillBridgeWorker/1.0 (+https://skillbridge.id/bot)"
        }

        async with httpx.AsyncClient(timeout=self.timeout, headers=headers) as client:
            for site in self.sites:
                if len(results) >= limit:
                    break
                logger.info(f"Mengambil lowongan dari Lever site: {site}")
                postings = await self._fetch_site_postings(client, site)
                await asyncio.sleep(1.0)  # Rate limiting 1 req/detik

                for post in postings:
                    if len(results) >= limit:
                        break
                    title = post.get("text", "")
                    if not any(role in title.lower() for role in ["data", "analyst", "intelligence", "analytics", "bi"]):
                        continue

                    post_id = str(post.get("id", ""))
                    categories = post.get("categories") or {}
                    location = categories.get("location", "Unspecified")
                    commitment = categories.get("commitment", "Full-time")

                    description_parts = [
                        post.get("descriptionPlain", "") or post.get("description", "")
                    ]
                    for list_item in post.get("lists", []):
                        description_parts.append(f"{list_item.get('text', '')}:\n{list_item.get('content', '')}")

                    description_raw = "\n\n".join(filter(None, description_parts))

                    results.append(RawJob(
                        external_id=post_id,
                        source_name=self.name,
                        source_url=post.get("hostedUrl", f"https://jobs.lever.co/{site}/{post_id}"),
                        title=title,
                        company=site.capitalize(),
                        location=location,
                        description_raw=description_raw,
                        retrieval_method="public_api",
                        employment_type=commitment,
                        metadata={"site": site, "team": categories.get("team")}
                    ))

        logger.info(f"Lever selesai: {len(results)} lowongan didapatkan.")
        return results

