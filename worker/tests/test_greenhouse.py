import html

from worker.pipeline.clean import clean_html_text
from worker.pipeline.extract import extract_job_details_rule_based
from worker.sources.greenhouse import GreenhouseSource, format_location, parse_pay_range

# Disederhanakan dari https://job-boards.greenhouse.io/cloudflare/jobs/8109620
CLOUDFLARE_CONTENT = """
<div class="content-intro"><h3>About Us</h3><p>At Cloudflare, we are on a mission to help build a better Internet.</p></div>
<div>
<p><strong>Available Locations: London</strong></p>
<p><strong>About the Team</strong></p>
<p>The Data Intelligence &amp; Analytics team builds a unified data platform.</p>
<p><strong>Role Requirements</strong></p>
<ul>
<li>B.S. or M.S in Computer Science, Statistics, Mathematics, or other quantitative fields</li>
<li>4+ years experience in a centralized data analytics team</li>
<li>Expert-level proficiency in writing and optimizing complex SQL queries</li>
<li>3+ years experience working in version control environments such as Gitlab or Github</li>
<li>2+ years experience with job orchestration tools like Apache Airflow</li>
<li>2+ years experience with data transformation frameworks (e.g., dbt, Fivetran)</li>
</ul>
<p><strong>Nice-to-Have Experience</strong></p>
<ul><li>Experience with statistical analysis programming languages (Python, R etc.)</li></ul>
</div>
<div class="content-conclusion">
<p><strong>What Makes Cloudflare Special?</strong></p>
<p>We're a highly ambitious, large-scale technology company with a soul.</p>
<p>Cloudflare is proud to be an equal opportunity employer.</p>
</div>
"""

API_JOB = {
    "id": 8109620,
    "title": "Data Analyst",
    "location": {"name": "Hybrid"},
    "absolute_url": "https://job-boards.greenhouse.io/cloudflare/jobs/8109620?gh_jid=8109620",
    "content": html.escape(CLOUDFLARE_CONTENT),
    "company_name": "Cloudflare",
}


def test_greenhouse_job_matches_original_posting():
    raw = GreenhouseSource.to_raw_job(API_JOB, "cloudflare")
    assert raw.company == "Cloudflare"
    assert raw.location == "London (Hybrid)"
    assert raw.external_id == "8109620"

    text = clean_html_text(raw.description_raw)
    assert "About the Team" in text
    assert "Role Requirements" in text
    # Profil perusahaan, penutup, EEO, dan baris lokasi tidak ikut masuk deskripsi
    assert "mission to help build a better Internet" not in text
    assert "What Makes Cloudflare Special" not in text
    assert "equal opportunity" not in text
    assert "Available Locations" not in text


def test_greenhouse_requirements_and_nice_to_have_are_split():
    raw = GreenhouseSource.to_raw_job(API_JOB, "cloudflare")
    details = extract_job_details_rule_based(raw.title, clean_html_text(raw.description_raw))
    assert details.experience_years_min == 4
    assert details.education == "Bachelor"
    for skill in ["SQL", "Git", "Airflow", "DBT", "Fivetran"]:
        assert skill in details.required_skills
    # Python, R, dan statistik hanya disebut di Nice-to-Have; "Statistics" di baris jurusan bukan syarat skill
    for skill in ["Python", "R", "Statistics"]:
        assert skill in details.preferred_skills
        assert skill not in details.required_skills


def test_format_location_and_company_fallback():
    assert format_location("Hybrid", ["London"]) == ("London (Hybrid)", False)
    assert format_location("Remote", []) == ("Remote", True)
    assert format_location("Singapore", []) == ("Singapore", False)
    raw = GreenhouseSource.to_raw_job({"id": 1, "title": "Data Analyst", "content": ""}, "gitlab")
    assert raw.company == "GitLab"


def test_parse_pay_range():
    job = {"pay_input_ranges": [{"min_cents": 6500000, "max_cents": 8000000, "currency_type": "gbp"}]}
    assert parse_pay_range(job) == {
        "salary_min": 65000, "salary_max": 80000, "salary_currency": "GBP", "salary_period": "year",
    }
    assert parse_pay_range({}) == {}
