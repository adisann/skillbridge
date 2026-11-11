import re

HSK = re.compile(r"\bhsk\s*[-:(]?\s*(?:(?:level|tingkat|lv\.?)\s*)?([1-9])\b", re.I)
MANDARIN = re.compile(r"\bmandarin\b", re.I)
JLPT = re.compile(r"\b(?:JLPT\s*[-:(]?\s*(?:(?:level|tingkat)\s*)?)?N([1-5])\b", re.I)
JAPANESE = re.compile(r"\b(?:jepang|japanese|jlpt)\b", re.I)
OPTIONAL = re.compile(r"preferred|nice[\s-]+to[\s-]+have|nilai (?:plus|tambah)|diutamakan|tambahan|\ba plus\b", re.I)


def extract_language_requirements(title: str, text: str) -> tuple[list[str], list[str]]:
    required, preferred = [], []
    optional_section = False
    for line in text.splitlines():
        # Hanya heading mengubah section; '(advanced functions preferred)' tidak mengubah baris berikutnya.
        if len(line.strip()) < 65 and line.strip().rstrip(":").lower() in {"preferred", "nice to have", "nice-to-have", "persyaratan tambahan", "nilai tambah"}:
            optional_section = True
        if re.match(r"^(?:requirements|job requirements|kualifikasi|persyaratan wajib)\s*:?$", line.strip(), re.I):
            optional_section = False
        levels = HSK.findall(line)
        names = [f"Mandarin (HSK {level})" for level in levels] if levels else (["Mandarin"] if MANDARIN.search(line) else [])
        japanese_levels = JLPT.findall(line) if JAPANESE.search(line + " " + title) else []
        names.extend([f"Jepang (JLPT N{level})" for level in japanese_levels] if japanese_levels else (["Jepang"] if JAPANESE.search(line) else []))
        target = preferred if optional_section or OPTIONAL.search(line) else required
        target.extend(names)
    if MANDARIN.search(title) and not any(name.startswith("Mandarin") for name in required):
        required.append("Mandarin")
    if JAPANESE.search(title) and not any(name.startswith("Jepang") for name in required):
        required.append("Jepang")
    def unique(names):
        if any(HSK.search(name) for name in names):
            names = [name for name in names if name != "Mandarin"]
        if any(JLPT.search(name) for name in names):
            names = [name for name in names if name != "Jepang"]
        return list(dict.fromkeys(names))
    required = unique(required)
    return required, [name for name in unique(preferred) if name not in required]
