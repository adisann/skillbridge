import re
import logging
from typing import Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ExtractedJobDetails(BaseModel):
    """Hasil ekstraksi terstruktur dari deskripsi lowongan kerja."""
    canonical_title: str
    seniority: Optional[str] = None  # Junior, Mid, Senior, Lead, Internship, or None
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    experience_years_min: Optional[int] = None
    education: Optional[str] = None  # Bachelor, Master, High School, etc.


# Heuristik rule-based ekstraksi awal sebagai fallback cepat
KNOWN_SKILLS = [
    "SQL", "PostgreSQL", "MySQL", "BigQuery", "Snowflake", "Python", "R",
    "Excel", "Tableau", "Power BI", "Looker", "Metabase", "Pandas", "NumPy",
    "A/B Testing", "Statistics", "Machine Learning", "DBT", "Airflow", "ETL",
    "Data Modeling", "Data Warehousing", "Git", "Google Analytics"
]


def extract_job_details_rule_based(title: str, text: str) -> ExtractedJobDetails:
    """Ekstraksi berbasis aturan/heuristik untuk parsing cepat tanpa memanggil API LLM."""
    lower_title = title.lower()
    lower_text = text.lower()

    # Tentukan canonical_title
    if "bi" in lower_title or "business intelligence" in lower_title:
        canonical = "BI Analyst"
    elif "data" in lower_title and "analyst" in lower_title:
        canonical = "Data Analyst"
    else:
        canonical = title.strip()

    # Tentukan seniority
    seniority = None
    if any(k in lower_title for k in ["lead", "principal", "head"]):
        seniority = "Lead"
    elif any(k in lower_title for k in ["senior", "sr."]):
        seniority = "Senior"
    elif any(k in lower_title for k in ["junior", "jr.", "entry"]):
        seniority = "Junior"
    elif "intern" in lower_title:
        seniority = "Internship"
    elif "mid" in lower_title:
        seniority = "Mid"

    # Tentukan experience_years_min
    years_match = re.search(r"(\d+)\+?\s*(?:tahun|thn|years?|yrs?)\b", lower_text)
    exp_years = int(years_match.group(1)) if years_match else None

    # Tentukan education
    education = None
    if any(k in lower_text for k in ["s1", "sarjana", "bachelor"]):
        education = "Bachelor"
    elif any(k in lower_text for k in ["s2", "magister", "master"]):
        education = "Master"

    # Deteksi skill
    found_skills = []
    for skill in KNOWN_SKILLS:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, lower_text):
            found_skills.append(skill)

    # Pisahkan required vs preferred berdasarkan kemunculan di section
    required = []
    preferred = []
    if "tambahan" in lower_text or "preferred" in lower_text or "nice to have" in lower_text:
        parts = re.split(r"(?:tambahan|preferred|nice to have|plus)", lower_text, maxsplit=1)
        req_part = parts[0]
        pref_part = parts[1] if len(parts) > 1 else ""

        for s in found_skills:
            if re.search(r"\b" + re.escape(s.lower()) + r"\b", pref_part) and not re.search(r"\b" + re.escape(s.lower()) + r"\b", req_part):
                preferred.append(s)
            else:
                required.append(s)
    else:
        required = found_skills

    return ExtractedJobDetails(
        canonical_title=canonical,
        seniority=seniority,
        required_skills=required,
        preferred_skills=preferred,
        experience_years_min=exp_years,
        education=education
    )

