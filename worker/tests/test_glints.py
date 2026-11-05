import json

from worker.pipeline.extract import extract_min_gpa, extract_job_details_rule_based
from worker.sources.glints import parse_glints_job

URL = "https://glints.com/id/en/opportunities/jobs/asisten-manager/847df094-1d3c-408d-9634-07abce53eb44"


def build_page(**overrides) -> str:
    description = {
        "blocks": [
            {"type": "unstyled", "text": "Asisten Manager"},
            {"type": "unstyled", "text": ""},
            {"type": "unstyled", "text": "Kualifikasi:"},
            {"type": "unordered-list-item", "text": "Minimal S1 dengan IPK minimal 3,00"},
            {"type": "unordered-list-item", "text": "Hubungi hr@contoh.co.id atau 081234567890"},
        ],
        "entityMap": {},
    }
    data = {
        "id": "847df094-1d3c-408d-9634-07abce53eb44",
        "title": "Asisten Manager",
        "status": "OPEN",
        "closedAt": None,
        "type": "FULL_TIME",
        "workArrangementOption": "HYBRID",
        "isRemote": False,
        "educationLevel": "BACHELOR_DEGREE",
        "minYearsOfExperience": 1,
        "maxYearsOfExperience": 3,
        "createdAt": "2026-11-05T16:18:57.555701Z",
        "expiryDate": "2026-12-06",
        "country": {"code": "ID"},
        "company": {"name": "PT Sekawan Teknologi Nusantara"},
        "location": {
            "administrativeLevelName": "District",
            "name": "Cilandak",
            "parents": [
                {"administrativeLevelName": "City", "name": "Jakarta Selatan"},
                {"administrativeLevelName": "Province", "name": "DKI Jakarta"},
            ],
        },
        "shouldShowSalary": True,
        "salaries": [
            {"CurrencyCode": "IDR", "minAmount": 200000, "maxAmount": 500000, "salaryMode": "MONTH", "salaryType": "BONUS"},
            {"CurrencyCode": "IDR", "minAmount": 3000000, "maxAmount": 5000000, "salaryMode": "MONTH", "salaryType": "BASIC"},
        ],
        "skills": [
            {"mustHave": True, "skill": {"name": "Scheduling"}},
            {"mustHave": False, "skill": {"name": "Google Sheets"}},
        ],
        "descriptionJsonString": json.dumps(description),
    }
    data.update(overrides)
    payload = {"props": {"pageProps": {"initialData": {"data": data}}}}
    return f'<html><script id="__NEXT_DATA__" type="application/json">{json.dumps(payload)}</script></html>'


def test_parse_glints_job_full_fields():
    job = parse_glints_job(build_page(), URL)
    assert job is not None
    assert job.source_name == "glints" and job.retrieval_method == "public_page"
    assert job.company == "PT Sekawan Teknologi Nusantara"
    assert job.location == "Jakarta Selatan, DKI Jakarta (Hybrid)"
    assert job.employment_type == "Full-time"
    assert job.education_level == "Bachelor"
    assert job.experience_years_min == 1
    assert (job.salary_min, job.salary_max, job.salary_currency, job.salary_period) == (3000000, 5000000, "IDR", "month")
    assert {"name": "Scheduling", "must_have": True} in job.skill_hints
    assert {"name": "Google Sheets", "must_have": False} in job.skill_hints
    assert job.expires_at is not None


def test_parse_glints_job_description_bullets_and_privacy():
    job = parse_glints_job(build_page(), URL)
    assert "• Minimal S1 dengan IPK minimal 3,00" in job.description_raw
    assert "hr@contoh.co.id" not in job.description_raw
    assert "081234567890" not in job.description_raw
    assert "[email redacted]" in job.description_raw


def test_parse_glints_job_hidden_salary_still_saved():
    job = parse_glints_job(build_page(shouldShowSalary=False), URL)
    assert job is not None
    assert job.salary_min is None and job.salary_max is None and job.salary_period is None


def test_parse_glints_job_bonus_only_is_not_salary():
    only_bonus = [{"CurrencyCode": "IDR", "minAmount": 1, "maxAmount": 9, "salaryMode": "MONTH", "salaryType": "BONUS"}]
    job = parse_glints_job(build_page(salaries=only_bonus), URL)
    assert job.salary_min is None


def test_parse_glints_job_skips_closed_and_foreign_and_broken():
    assert parse_glints_job(build_page(status="CLOSED"), URL) is None
    assert parse_glints_job(build_page(country={"code": "SG"}), URL) is None
    assert parse_glints_job("<html>tidak ada data</html>", URL) is None


def test_extract_min_gpa_variants():
    assert extract_min_gpa("Minimal S1 dengan IPK minimal 3,00") == 3.0
    assert extract_min_gpa("Min. GPA 3.25 from 4.00") == 3.25
    assert extract_min_gpa("IPK >= 2.75") == 2.75
    assert extract_min_gpa("Indeks Prestasi Kumulatif min 3") == 3.0
    assert extract_min_gpa("Pengalaman 3 tahun, tanpa syarat nilai") is None
    assert extract_min_gpa("GPA tidak dipersyaratkan 2026") is None


def test_rule_based_details_include_min_gpa():
    details = extract_job_details_rule_based("Staff Admin", "Lulusan S1, IPK minimal 3.00")
    assert details.min_gpa == 3.0


def test_canonical_title_bi_hanya_kata_utuh():
    assert extract_job_details_rule_based("Staf Bioskop XXI", "Melayani pelanggan").canonical_title == "Staf Bioskop XXI"
    assert extract_job_details_rule_based("BI Analyst", "SQL").canonical_title == "BI Analyst"
    assert extract_job_details_rule_based("Power BI Developer", "SQL").canonical_title == "BI Analyst"
