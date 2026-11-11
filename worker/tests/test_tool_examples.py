import json
from pathlib import Path

from worker.pipeline.extract import extract_job_details_rule_based
from worker.pipeline.normalize import normalize_skills_list


def test_amar_bigquery_alias_and_explicit_plus_point_are_preserved():
    jobs = json.loads((Path(__file__).parent / "fixtures/real_jobs.json").read_text(encoding="utf-8"))
    job = next(j for j in jobs if j["company"] == "Amar Bank" and "Digital Lending" in j["title"])
    details = extract_job_details_rule_based(job["title"], job["description"])
    assert "BigQuery" in details.preferred_skills
    assert "BigQuery" not in details.required_skills
    assert "Looker" in details.preferred_skills
    assert "SPSS" in details.required_skills
    assert "Python" in details.required_skills
    assert "Statistics" in details.required_skills
    assert "Machine Learning" in details.required_skills


def test_bigquery_not_demoted_when_required_outside_example_list():
    details = extract_job_details_rule_based("Analyst", "Requirements:\nBigQuery is required.\nUse analytics tool (Eg: Big Query, Python, etc).\nPlus Point If You Have:\nBig Query and Looker.")
    assert "BigQuery" in details.required_skills
    assert "BigQuery" not in details.preferred_skills


def test_bigquery_alias_deduplication():
    assert normalize_skills_list(["Big Query", "Google Big Query", "BigQuery"]) == ["BigQuery"]
