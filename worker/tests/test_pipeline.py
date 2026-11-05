import pytest
from worker.pipeline.clean import clean_html_text
from worker.pipeline.dedupe import compute_content_hash, Deduplicator
from worker.pipeline.extract import extract_job_details_rule_based
from worker.pipeline.normalize import normalize_skill_name, normalize_skills_list


def test_clean_html_text():
    html_input = "<div><p>Hello <b>World</b></p><script>alert('xss')</script><ul><li>SQL</li><li>Python</li></ul></div>"
    cleaned = clean_html_text(html_input)
    assert "alert" not in cleaned
    assert "Hello World" in cleaned
    assert "SQL" in cleaned
    assert "Python" in cleaned


def test_normalize_skills():
    assert normalize_skill_name("postgres") == "PostgreSQL"
    assert normalize_skill_name("postgresql") == "PostgreSQL"
    assert normalize_skill_name("ms excel") == "Excel"
    assert normalize_skill_name("bi") == "Business Intelligence"

    skills = ["postgres", "PostgreSQL", "ms excel", "Python"]
    normalized = normalize_skills_list(skills)
    assert normalized == ["PostgreSQL", "Excel", "Python"]


def test_deduplication():
    dedup = Deduplicator()
    hash1 = compute_content_hash("Data Analyst", "Google", "Description A")
    hash2 = compute_content_hash("Data Analyst", "Google", "Description B")

    assert not dedup.is_duplicate("greenhouse", "101", hash1)
    assert dedup.is_duplicate("greenhouse", "101", hash1)  # duplicate ID
    assert not dedup.is_duplicate("lever", "102", hash2)


def test_extract_job_details():
    title = "Senior Data Analyst"
    text = "Kualifikasi: Menguasai SQL dan Microsoft Excel. Pengalaman 3 tahun. Minimal S1 Informatika."
    details = extract_job_details_rule_based(title, text)

    assert details.canonical_title == "Data Analyst"
    assert details.seniority == "Senior"
    assert details.experience_years_min == 3
    assert details.education == "Bachelor"
    assert "SQL" in details.required_skills
    assert "Excel" in details.required_skills

