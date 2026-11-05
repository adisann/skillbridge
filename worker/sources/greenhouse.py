import asyncio
import logging
from typing import Any
import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from .base import JobSource, RawJob

logger = logging.getLogger(__name__)


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
        url = f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs?content=true"
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

                for job in raw_jobs:
                    if len(results) >= limit:
                        break
                    title = job.get("title", "")
                    # Filter role prioritas: Data Analyst / BI Analyst
                    if not any(role in title.lower() for role in ["data", "analyst", "intelligence", "analytics"]):
                        continue

                    job_id = str(job.get("id", ""))
                    location = (job.get("location") or {}).get("name", "Remote / Unspecified")
                    content = job.get("content", "")

                    results.append(RawJob(
                        external_id=job_id,
                        source_name=self.name,
                        source_url=job.get("absolute_url", f"https://boards.greenhouse.io/{board}/jobs/{job_id}"),
                        title=title,
                        company=board.capitalize(),
                        location=location,
                        description_raw=content,
                        retrieval_method="public_api",
                        metadata={"board": board, "updated_at": job.get("updated_at")}
                    ))

        logger.info(f"Greenhouse selesai: {len(results)} lowongan didapatkan.")
        return results

