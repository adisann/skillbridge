import re


def usable_description(text: str | None) -> bool:
    """Deskripsi kosong/placeholder bukan data persyaratan untuk ekstraksi."""
    value = (text or "").strip()
    return bool(value) and value.lower() not in {"nan", "none", "null", "n/a"} and not (
        len(value) < 300 and re.search(r"\bdeskripsi kualifikasi lowongan\.?$", value, re.I)
    )
