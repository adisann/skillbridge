import asyncio

import httpx
import pytest

from worker.pipeline.description import usable_description
from worker.sources.base import RawJob
from worker.sources.linkedin import LinkedInSource, LinkedInGuestBlocked, _row_text


def test_missing_description_is_not_a_requirement():
    for value in (None, "", " ", "nan", "None", "null", "N/A", "Analyst di Perusahaan. Deskripsi kualifikasi lowongan."):
        assert not usable_description(value)
    assert usable_description("Required: SQL and Python/R. At least 2 years of experience.")
    assert _row_text(float("nan")) == ""


def test_guest_description_keeps_alternatives_and_removes_contact_data():
    async def run():
        def respond(request):
            assert not request.headers.get("cookie")
            assert not request.headers.get("authorization")
            return httpx.Response(200, text='<div class="show-more-less-html__markup"><p>SQL and Python/R</p><p>Contact test@example.com 081234567890</p></div>')
        async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
            text = await LinkedInSource()._fetch_guest_job_description(client, "https://www.linkedin.com/jobs/view/4479993032")
        assert "Python/R" in text
        assert "test@example.com" not in text
        assert "081234567890" not in text
    asyncio.run(run())


@pytest.mark.parametrize("status,headers,body", [
    (403, {}, "Forbidden"), (429, {}, "Rate limited"), (999, {}, "Blocked"),
    (302, {"location": "https://www.linkedin.com/authwall"}, ""),
    (200, {}, '<form action="/captcha"></form>'),
])
def test_blocked_guest_stops_without_further_requests(status, headers, body):
    async def run():
        requests = []
        def respond(request):
            requests.append(request)
            return httpx.Response(status, headers=headers, text=body)
        source = LinkedInSource()
        async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
            for _ in range(2):
                with pytest.raises(LinkedInGuestBlocked):
                    await source._fetch_guest_job_description(client, "https://www.linkedin.com/jobs/view/4479993032")
        assert len(requests) == 1
    asyncio.run(run())


def test_worker_preserves_existing_job_when_description_is_empty(monkeypatch):
    import worker.main as main
    saved, audits = [], []
    class Source:
        name = "linkedin"
        async def fetch_jobs(self, limit):
            return [RawJob(external_id="li-1", source_name="linkedin", source_url="https://www.linkedin.com/jobs/view/1", title="Analyst", company="Company", location="Indonesia", description_raw="")]
    class Storage:
        def get_all_skills_and_aliases(self):
            return {}
        def get_existing_jobs(self, source):
            return {"li-1": "existing-full-description"}
        async def upsert_job_with_skills(self, **kwargs):
            saved.append(kwargs)
        async def log_worker_run(self, **kwargs):
            audits.append(kwargs)
    monkeypatch.setattr(main, "get_source_by_name", lambda *args, **kwargs: Source())
    monkeypatch.setattr(main, "SupabaseStorage", Storage)
    monkeypatch.setattr(main, "get_embedding_provider", lambda: None)
    asyncio.run(main.run_worker("linkedin", 1))
    assert saved == []
    assert audits[0]["failed"] == 1
    assert audits[0]["status"] == "failed"
