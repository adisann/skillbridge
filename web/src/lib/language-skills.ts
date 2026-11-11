/** Level hanya dibaca bila HSK disebut eksplisit; Mandarin umum tidak diberi level rekaan. */
function hskLevel(text: string): number | null {
  const match = text.match(/\bhsk\s*[-:(]?\s*(?:(?:level|tingkat|lv\.?)\s*)?([1-9])\b/i);
  return match ? Number(match[1]) : null;
}

export const MANDARIN_SKILL_RULE = { name: "Mandarin", regex: /\bmandarin\b/i };
export const HSK_SKILL_RULES = Array.from({ length: 9 }, (_, index) => ({
  name: `Mandarin (HSK ${index + 1})`,
  regex: new RegExp(`\\bhsk\\s*[-:(]?\\s*(?:(?:level|tingkat|lv\\.?)\\s*)?${index + 1}\\b`, "i"),
}));

interface LanguageQualification {
  language: "mandarin" | "japanese";
  scheme: "HSK" | "JLPT";
  rank: number; // Makin besar makin tinggi, termasuk sistem yang penomorannya terbalik.
  label: string;
  skill: string;
}

export function languageQualification(text: string): LanguageQualification | null {
  const hsk = hskLevel(text);
  if (hsk != null) return { language: "mandarin", scheme: "HSK", rank: hsk, label: `HSK Level ${hsk}`, skill: `Mandarin (HSK ${hsk})` };
  const jlpt = text.match(/\b(?:JLPT\s*[-:(]?\s*(?:(?:level|tingkat)\s*)?)?N([1-5])\b/i);
  if (jlpt) {
    const level = Number(jlpt[1]);
    return { language: "japanese", scheme: "JLPT", rank: 6 - level, label: `JLPT N${level}`, skill: `Jepang (JLPT N${level})` };
  }
  return null;
}

export function languageFamily(skill: string): LanguageQualification["language"] | null {
  const qualification = languageQualification(skill);
  if (qualification) return qualification.language;
  if (/^(?:bahasa\s+)?mandarin(?:\s+chinese)?$|^chinese\s*\(mandarin\)$/i.test(skill.trim())) return "mandarin";
  if (/^(?:bahasa\s+)?(?:jepang|japanese)(?:\s+language)?$/i.test(skill.trim())) return "japanese";
  return null;
}

export const JAPANESE_SKILL_RULE = { name: "Jepang", regex: /\b(?:jepang|japanese)\b/i };
export const JLPT_SKILL_RULES = Array.from({ length: 5 }, (_, index) => ({
  name: `Jepang (JLPT N${index + 1})`,
  regex: new RegExp(`(?:\\bJLPT\\s*[-:(]?\\s*(?:(?:level|tingkat)\\s*)?N${index + 1}\\b|\\b(?:jepang|japanese)\\b[^\\n.!?]{0,50}\\bN${index + 1}\\b)`, "i"),
}));
