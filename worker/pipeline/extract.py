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
    min_gpa: Optional[float] = None  # IPK minimum (skala 4.00)


_GPA_KEYWORD = re.compile(r"\b(?:ipk|gpa|indeks\s+prestasi(?:\s+kumulatif)?)\b", re.IGNORECASE)
_GPA_NUMBER = re.compile(r"(?<![\d.,])([0-4](?:[.,]\d{1,2})?)(?![\d])")


def extract_min_gpa(text: str) -> Optional[float]:
    """Ambil IPK minimum (skala 4) dari teks, mis. 'IPK minimal 3,00' atau 'min. GPA 3.0'."""
    for keyword in _GPA_KEYWORD.finditer(text or ""):
        window = text[keyword.end(): keyword.end() + 40]
        number = _GPA_NUMBER.search(window)
        if not number:
            continue
        value = float(number.group(1).replace(",", "."))
        if 1.0 <= value <= 4.0:
            return round(value, 2)
    return None


# Heuristik rule-based ekstraksi awal sebagai fallback cepat
KNOWN_SKILLS = [
    "SQL", "PostgreSQL", "MySQL", "BigQuery", "Snowflake", "Python", "R",
    "Excel", "Microsoft Excel", "Google Sheets", "Tableau", "Power BI", "Looker", "Metabase", "Pandas", "NumPy",
    "A/B Testing", "Statistics", "Machine Learning", "Deep Learning", "Data Science", "DBT", "Airflow", "ETL",
    "Data Modeling", "Data Warehousing", "Data Visualization", "Data Cleaning", "Data Analysis", "Data Analytics",
    "E-Commerce Analytics", "Product Analytics", "Business Analytics", "Git", "Google Analytics", "Web Scraping",
    "Jira", "Agile", "Scrum", "Business Process Mapping", "Stakeholder Management"
]


def extract_job_details_rule_based(title: str, text: str) -> ExtractedJobDetails:
    """Ekstraksi berbasis aturan/heuristik untuk parsing cepat tanpa memanggil API LLM."""
    lower_title = title.lower()
    lower_text = text.lower()

    # Tentukan canonical_title
    if re.search(r"\bbi\b", lower_title) or "business intelligence" in lower_title:
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

    # Tentukan experience_years_min (dukung format rentang 3-5 tahun / 3–5 years -> min 3)
    range_match = re.search(r"(\d+)\s*(?:[-–—]|to|sampai)\s*(\d+)\+?\s*(?:tahun|thn|years?|yrs?)\b", lower_text)
    if range_match:
        exp_years = int(range_match.group(1))
    else:
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
            # Khusus 'Statistics': Pastikan bukan sekadar nama jurusan dalam syarat pendidikan
            if skill == "Statistics":
                has_tech_context = bool(
                    re.search(r"statistic(?:s|al)?\s+(?:analysis|modeling|methods?|techniques?|inference|tests?|knowledge|skills?|experiment)", lower_text)
                    or re.search(r"(?:knowledge|grasp|understanding|proficien\w+|experience|skills?)\s+(?:in|of|with)?\s*(?:[a-z\s,]+)?statistic", lower_text)
                    or re.search(r"(?:experiment\s+design|hypothesis\s+testing|a\/b\s+testing)\s+(?:and|with|in)?\s*statistic", lower_text)
                )
                only_degree = bool(re.search(r"(?:degree|sarjana|s1|s2|bachelor|master|jurusan|lulusan|discipline|major|background|field\s+of\s+study)\s+(?:in|of)?\s*[^.\n;]*\bstatistic", lower_text))
                if only_degree and not has_tech_context:
                    continue
            found_skills.append(skill)

    # Deteksi baris yang mengindikasikan kualifikasi opsional / nilai plus
    plus_lines = [
        line for line in lower_text.split("\n")
        if any(marker in line for marker in ["is a plus", "a plus", "nilai plus", "nilai tambah", "nice to have", "diutamakan", "preferred"])
    ]
    plus_text = " ".join(plus_lines)

    # Pisahkan required vs preferred berdasarkan kemunculan di section atau baris plus
    required = []
    preferred = []
    if any(k in lower_text for k in ["tambahan", "preferred", "nice to have", "plus", "nilai tambah"]):
        parts = re.split(r"(?:tambahan|preferred|nice to have|plus|nilai tambah)", lower_text, maxsplit=1)
        req_part = parts[0]
        pref_part = parts[1] if len(parts) > 1 else ""

        for s in found_skills:
            s_pat = r"\b" + re.escape(s.lower()) + r"\b"
            is_in_plus_line = bool(re.search(s_pat, plus_text))
            is_in_pref_part = bool(re.search(s_pat, pref_part)) and not bool(re.search(s_pat, req_part))

            if is_in_plus_line or is_in_pref_part:
                preferred.append(s)
            else:
                required.append(s)
    else:
        for s in found_skills:
            s_pat = r"\b" + re.escape(s.lower()) + r"\b"
            if re.search(s_pat, plus_text):
                preferred.append(s)
            else:
                required.append(s)

    return ExtractedJobDetails(
        canonical_title=canonical,
        seniority=seniority,
        required_skills=required,
        preferred_skills=preferred,
        experience_years_min=exp_years,
        education=education,
        min_gpa=extract_min_gpa(text),
    )

