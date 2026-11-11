import pytest
from worker.pipeline.clean import clean_html_text, normalize_bullets
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


def test_job_contact_redaction_preserves_requirements():
    cleaned = clean_html_text("<p>Required: SQL and Python/R. Minimum HSK Level 5.</p><p>Contact recruiter@example.test or +6281234567890</p>")
    assert "recruiter@example.test" not in cleaned
    assert "6281234567890" not in cleaned
    assert "SQL and Python/R" in cleaned
    assert "Minimum HSK Level 5" in cleaned


def test_clean_html_text_unescapes_greenhouse_content():
    escaped = "&lt;div&gt;&lt;p&gt;Analyze data &amp;amp; build dashboards&lt;/p&gt;&lt;ul&gt;&lt;li&gt;SQL&lt;/li&gt;&lt;/ul&gt;&lt;/div&gt;"
    cleaned = clean_html_text(escaped)
    assert "<" not in cleaned and "&lt;" not in cleaned
    assert "Analyze data & build dashboards" in cleaned
    assert "• SQL" in cleaned


def test_normalize_bullets_joins_lonely_bullet_with_text():
    raw = "Tugas:\n\n•\nAnalisis data penjualan\n\n•\nBuat dashboard : ringkas , jelas\n\nSyarat"
    assert normalize_bullets(raw) == "Tugas:\n\n• Analisis data penjualan\n• Buat dashboard: ringkas, jelas\n\nSyarat"


def test_normalize_skills():
    assert normalize_skill_name("postgres") == "PostgreSQL"
    assert normalize_skill_name("postgresql") == "PostgreSQL"
    assert normalize_skill_name("ms excel") == "Excel"
    assert normalize_skill_name("bi") == "Business Intelligence"

    skills = ["postgres", "PostgreSQL", "ms excel", "Python"]
    normalized = normalize_skills_list(skills)
    assert normalized == ["PostgreSQL", "Excel", "Python"]


def test_translated_skills_are_one_canonical_skill():
    assert normalize_skills_list(["Statistika", "Statistics", "Statistik", "Data Analysis", "Analisis Data", "Data Analisis"]) == ["Statistics", "Data Analysis"]
    assert normalize_skill_name("SQL") != normalize_skill_name("PostgreSQL")
    details = extract_job_details_rule_based("Analyst", "Kualifikasi wajib: Statistika, Analisis Data dan Pemodelan Data.")
    assert "Statistics" in details.required_skills
    assert "Data Analysis" in details.required_skills
    assert "Data Modeling" in details.required_skills


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

