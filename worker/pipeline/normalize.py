import logging
from typing import Dict

logger = logging.getLogger(__name__)

# Kamus alias skill umum untuk standardisasi taksonomi
DEFAULT_SKILL_ALIASES: Dict[str, str] = {
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "ms sql": "SQL Server",
    "mssql": "SQL Server",
    "sql server": "SQL Server",
    "google bigquery": "BigQuery",
    "big query": "BigQuery",
    "bi": "Business Intelligence",
    "powerbi": "Power BI",
    "power-bi": "Power BI",
    "ms excel": "Excel",
    "microsoft excel": "Excel",
    "py": "Python",
    "python3": "Python",
    "golang": "Go",
    "ab testing": "A/B Testing",
    "a/b test": "A/B Testing",
    "data warehouse": "Data Warehousing",
    "dwh": "Data Warehousing",
}


def normalize_skill_name(raw_name: str, custom_aliases: Dict[str, str] | None = None) -> str:
    """Menormalkan nama skill menggunakan kamus alias."""
    cleaned = raw_name.strip()
    key = cleaned.lower()

    if custom_aliases and key in custom_aliases:
        return custom_aliases[key]

    if key in DEFAULT_SKILL_ALIASES:
        return DEFAULT_SKILL_ALIASES[key]

    return cleaned


def normalize_skills_list(skills: list[str], custom_aliases: Dict[str, str] | None = None) -> list[str]:
    """Menormalkan daftar skill dan membuang duplikat setelah normalisasi."""
    normalized_set = set()
    result = []

    for s in skills:
        norm = normalize_skill_name(s, custom_aliases)
        if norm.lower() not in normalized_set:
            normalized_set.add(norm.lower())
            result.append(norm)

    return result

