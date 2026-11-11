import logging
import json
from pathlib import Path
from typing import Dict
from .languages import HSK, JLPT

SHARED_SKILL_ALIASES = json.loads((Path(__file__).resolve().parents[2] / "web/src/lib/data/skill-aliases.json").read_text(encoding="utf-8"))

logger = logging.getLogger(__name__)

# Kamus alias skill umum untuk standardisasi taksonomi
DEFAULT_SKILL_ALIASES: Dict[str, str] = {
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "ms sql": "SQL Server",
    "mssql": "SQL Server",
    "sql server": "SQL Server",
    "ibm spss": "SPSS",
    "bi": "Business Intelligence",
    "powerbi": "Power BI",
    "power-bi": "Power BI",
    "ms excel": "Excel",
    "microsoft excel": "Excel",
    "py": "Python",
    "python3": "Python",
    "golang": "Go",
    "a/b test": "A/B Testing",
    "dwh": "Data Warehousing",
}
DEFAULT_SKILL_ALIASES.update({alias.lower(): canonical for canonical, aliases in SHARED_SKILL_ALIASES.items() for alias in [canonical, *aliases]})


def normalize_skill_name(raw_name: str, custom_aliases: Dict[str, str] | None = None) -> str:
    """Menormalkan nama skill menggunakan kamus alias."""
    cleaned = raw_name.strip()
    if custom_aliases:
        cleaned = custom_aliases.get(cleaned.lower(), cleaned)
    cleaned = " ".join(cleaned.split())
    key = cleaned.lower()
    level = HSK.search(cleaned)
    if level:
        return f"Mandarin (HSK {level.group(1)})"
    if key in {"mandarin", "bahasa mandarin", "mandarin chinese", "chinese (mandarin)"}:
        return "Mandarin"
    japanese_level = JLPT.search(cleaned)
    if japanese_level:
        return f"Jepang (JLPT N{japanese_level.group(1)})"
    if key in {"jepang", "bahasa jepang", "japanese", "japanese language"}:
        return "Jepang"

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

    if any(HSK.search(name) for name in result):
        result = [name for name in result if name != "Mandarin"]
    if any(JLPT.search(name) for name in result):
        result = [name for name in result if name != "Jepang"]
    return result

