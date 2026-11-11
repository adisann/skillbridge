import { getCanonicalSkill } from "./matching-config.ts";
import type { RequirementEvaluation } from "./matching.ts";
import { canonicalSkillLabel, TRANSLATED_SKILL_RULES } from "./skill-taxonomy.ts";

export function requirementLabel(requirement: Pick<RequirementEvaluation, "skill" | "alternatives" | "exampleGroupLabel">): string {
  if (requirement.exampleGroupLabel) return `${requirement.exampleGroupLabel} (contoh: ${requirement.alternatives?.join(", ")})`;
  return requirement.alternatives?.join(" atau ") || requirement.skill;
}

export function requirementSummary(requirement: RequirementEvaluation): string {
  const label = requirementLabel(requirement);
  if (requirement.minimumNotMet) return `${label} — CV: ${requirement.currentLevelLabel}; syarat: ${requirement.requiredLevelLabel}`;
  if (requirement.exampleGroupLabel && requirement.matchedAlternative) return `${label} — ${requirement.matchedAlternative} tercantum di CV`;
  return requirement.matchedAlternative ? `${label} — terpenuhi melalui ${requirement.matchedAlternative}` : label;
}

/** Ringkasan generik ini bukan deskripsi persyaratan asli dari pemberi kerja. */
export function hasPlaceholderRequirements(description?: string | null): boolean {
  const text = (description || "").replace(/<[^>]*>/g, " ").trim();
  return text.length < 300 && /\bdeskripsi kualifikasi lowongan\.?$/i.test(text);
}

/** Satu skill kanonis dihitung sekali; skill wajib mengalahkan duplikat tambahan. */
export function uniqueSkills(skills: string[]): string[] {
  return [...new Map(skills.filter((s) => s.trim()).map((s) => [getCanonicalSkill(s), canonicalSkillLabel(s)])).values()];
}

function normalizeRequirementText(text: string): string {
  for (const rule of TRANSLATED_SKILL_RULES) text = text.replace(new RegExp(rule.regex.source, "giu"), rule.name);
  return text.replace(/\b(?:google\s+)?big\s*query\b/gi, "BigQuery")
    .replace(/\bgoogle\s+(?:data|looker)\s+studio\b/gi, "Looker")
    .replace(/\bpower\s*bi\b/gi, "Power BI");
}

const TOOL_EXAMPLES = /\b(BI tools?|analytics tools?|alat BI|alat analitik)\s*\(\s*(?:e\.?\s*g\.?|contoh|for example)\s*:?\s*([^\)\n]{3,350})\)/gi;
const escapePattern = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export interface ToolExampleGroup {
  skills: string[];
  label: string;
  sourceSnippet: string;
}

/** Hanya daftar contoh ALAT; daftar konsep/statistika atau koma biasa tetap terpisah. */
export function toolExampleGroups(skills: string[], description: string): ToolExampleGroup[] {
  const groups: ToolExampleGroup[] = [];
  const normalized = normalizeRequirementText(description.replace(/<[^>]*>/g, " "));
  for (const match of normalized.matchAll(TOOL_EXAMPLES)) {
    const members = uniqueSkills(skills).map((skill) => {
      const variants = [...new Set([normalizeRequirementText(skill), getCanonicalSkill(skill)])];
      const found = match[2].search(new RegExp(`(?<!\\w)(?:${variants.map(escapePattern).join("|")})(?!\\w)`, "i"));
      return { skill, position: found };
    }).filter((item) => item.position >= 0).sort((a, b) => a.position - b.position).map((item) => item.skill);
    if (members.length >= 2) groups.push({ skills: members, label: /\bBI\b/i.test(match[1]) ? "Alat BI" : "Alat analitik", sourceSnippet: match[0] });
  }
  return groups;
}

function independentRequirementLines(description: string): string[] {
  return normalizeRequirementText(description).replace(TOOL_EXAMPLES, "").split(/[\n.;]/)
    .filter((line) => /\b(?:must|required|wajib|harus|proficient|expert)\b/i.test(line));
}

export function isIndependentlyRequired(skill: string, description: string): boolean {
  const pattern = new RegExp(`(?<!\\w)${escapePattern(normalizeRequirementText(skill))}(?!\\w)`, "i");
  return independentRequirementLines(description).some((line) => pattern.test(line));
}

/** Simpan konteks contoh, alternatif, dan syarat eksplisit sebelum deskripsi katalog dibuang. */
export function matchingRequirementText(skills: string[], description: string): string {
  return [
    ...requirementGroups(skills, description).filter((group) => group.length > 1).map((group) => group.join(" / ")),
    ...toolExampleGroups(skills, description).map((group) => group.sourceSnippet),
    ...independentRequirementLines(description),
  ].join("\n");
}

/** Gabungkan hanya alternatif yang ditulis eksplisit, misalnya "Python/R". */
export function requirementGroups(skills: string[], description = ""): string[][] {
  const remaining = new Set(skills);
  const groups: string[][] = [];
  const names = uniqueSkills(skills.flatMap((s) => [s, getCanonicalSkill(s)]));
  // Gunakan juga nama tampilan (mis. Microsoft Excel) saat membaca teks asli.
  const variants = [...new Set([...skills, ...names])].sort((a, b) => b.length - a.length);
  if (variants.length > 1) {
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const name = `(?:${variants.map(escape).join("|")})`;
    const separator = "(?:[ \\t]*/[ \\t]*|[ \\t]+(?:or|atau)[ \\t]+)";
    const pattern = new RegExp(`(?<![\\w/])${name}(?:${separator}${name})+(?![\\w/])`, "gi");
    const text = normalizeRequirementText(description.replace(/<[^>]*>/g, " "));
    for (const match of text.matchAll(pattern)) {
      const keys = match[0].split(/\s*\/\s*|\s+(?:or|atau)\s+/i).map(getCanonicalSkill);
      const alternatives = skills.filter((s) => keys.includes(getCanonicalSkill(s)));
      // Jangan menyimpulkan rantai alternatif dari dua kalimat yang berbeda.
      if (alternatives.length > 1 && alternatives.every((s) => remaining.has(s))) {
        groups.push(alternatives);
        alternatives.forEach((s) => remaining.delete(s));
      }
    }
  }
  return [...groups, ...[...remaining].map((s) => [s])];
}
