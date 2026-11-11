import aliases from "./data/skill-aliases.json" with { type: "json" };

const SKILL_ALIAS_ENTRIES = Object.entries(aliases);
const labels = new Map(SKILL_ALIAS_ENTRIES.flatMap(([canonical, alternatives]) =>
  [canonical, ...alternatives].map((alias) => [alias.trim().replace(/\s+/g, " ").toLowerCase(), canonical] as const)));

export function canonicalSkillLabel(name: string): string {
  const normalized = name.trim().replace(/\s+/g, " ");
  return labels.get(normalized.toLowerCase()) || normalized;
}

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
export const TRANSLATED_SKILL_RULES = SKILL_ALIAS_ENTRIES.map(([name, alternatives]) => ({
  name,
  regex: new RegExp(`(?<![\\p{L}\\p{N}_])(?:${[name, ...alternatives].map(escapePattern).join("|")})(?![\\p{L}\\p{N}_])`, "iu"),
}));
