import pytest
from worker.pipeline.clean import clean_html_text
from worker.pipeline.dedupe import compute_content_hash, Deduplicator
from worker.pipeline.extract import extract_job_details_rule_based
from worker.pipeline.normalize import normalize_skills_list, normalize_skill_name

# Fixture HTML kotor dari web scraper
MOCK_GREENHOUSE_HTML = """
<div>
  <h2>Data Analyst - Southeast Asia</h2>
  <script>alert('malicious_payload');</script>
  <style>.hidden { display: none; }</style>
  <p>We are seeking a <strong>Data Analyst</strong> with at least 2+ years of experience.</p>
  <h3>Key Requirements:</h3>
  <ul>
    <li>Proficient in SQL (Postgres / MySQL) and Python</li>
    <li>Hands-on experience with Tableau or Power BI</li>
    <li>Strong knowledge of statistics and A/B testing</li>
  </ul>
  <h3>Nice to Have (Tambahan):</h3>
  <ul>
    <li>Experience with DBT, BigQuery, or Snowflake</li>
  </ul>
  <p>Education: Bachelor's degree (S1) in Computer Science, Statistics, or related field.</p>
</div>
"""

MOCK_LEVER_HTML = """
<div>
  <h1>BI Analyst / Business Intelligence</h1>
  <p>Location: Jakarta, Indonesia (Remote / Hybrid)</p>
  <p>Tanggung jawab utama:</p>
  <ul>
    <li>Mengembangkan dashboard interaktif dengan Power BI dan Metabase</li>
    <li>Menulis query SQL kompleks untuk ETL data pipeline</li>
  </ul>
  <p>Kualifikasi: Minimal 3 tahun pengalaman kerja, S1 Teknik atau Matematika.</p>
</div>
"""


def test_clean_html_text_strips_scripts_and_normalizes():
    cleaned = clean_html_text(MOCK_GREENHOUSE_HTML)
    assert "alert" not in cleaned
    assert "malicious_payload" not in cleaned
    assert "display: none" not in cleaned
    assert "Data Analyst - Southeast Asia" in cleaned
    assert "• Proficient in SQL" in cleaned
    assert "• Hands-on experience with Tableau" in cleaned


def test_clean_html_text_empty_and_whitespace():
    assert clean_html_text("") == ""
    assert clean_html_text("   \n\n\t  ") == ""
    assert clean_html_text("Hello <br> World") == "Hello\nWorld"


def test_extract_job_details_rule_based():
    cleaned = clean_html_text(MOCK_GREENHOUSE_HTML)
    details = extract_job_details_rule_based("Data Analyst - Southeast Asia", cleaned)

    assert details.canonical_title == "Data Analyst"
    assert details.experience_years_min == 2
    assert details.education == "Bachelor"
    assert "SQL" in details.required_skills
    assert "Python" in details.required_skills
    assert any("tableau" in s.lower() or "power bi" in s.lower() for s in details.required_skills)
    assert "DBT" in details.preferred_skills or "Snowflake" in details.preferred_skills or "BigQuery" in details.preferred_skills


def test_extract_bi_analyst_details():
    cleaned = clean_html_text(MOCK_LEVER_HTML)
    details = extract_job_details_rule_based("BI Analyst / Business Intelligence", cleaned)

    assert details.canonical_title == "BI Analyst"
    assert details.experience_years_min == 3
    assert details.education == "Bachelor"
    assert "Power BI" in details.required_skills
    assert "SQL" in details.required_skills


def test_skill_normalization():
    raw_skills = ["postgres", "ms excel", "powerbi", "py", "ab testing", "SQL Server"]
    custom_aliases = {"dax": "DAX", "postgres": "PostgreSQL"}
    normalized = normalize_skills_list(raw_skills, custom_aliases=custom_aliases)

    assert "PostgreSQL" in normalized
    assert "Excel" in normalized
    assert "Power BI" in normalized
    assert "Python" in normalized
    assert "A/B Testing" in normalized


def test_deduplicator_and_content_hash():
    deduper = Deduplicator()
    hash1 = compute_content_hash("Data Analyst", "Binance", "Desc A")
    hash2 = compute_content_hash("Data Analyst", "Binance", "Desc A")
    hash3 = compute_content_hash("Data Analyst", "Binance", "Desc B (Changed)")

    assert hash1 == hash2
    assert hash1 != hash3

    assert not deduper.is_duplicate("greenhouse", "job-1", hash1)
    # Panggilan kedua dengan ID atau hash yang sama harus dideteksi duplikat
    assert deduper.is_duplicate("greenhouse", "job-1", hash1)
    assert deduper.is_duplicate("greenhouse", "job-99", hash1)  # Hash sama

