import { cvEvidence } from "./cv-evidence.ts";
import { getCanonicalSkill } from "./matching-config.ts";
import { canonicalSkillLabel } from "./skill-taxonomy.ts";

interface ResumeSkillDetail {
  name: string;
  claimed: boolean;
  needsReview: boolean;
  evidence: string | null;
}

/** Gabungkan padanan istilah, dengan bukti CV yang sudah ditinjau mendahului klaim alias. */
export function normalizeResumeSkills(details: ResumeSkillDetail[]): ResumeSkillDetail[] {
  const unique = new Map<string, ResumeSkillDetail>();
  const rank = (detail: ResumeSkillDetail) => detail.claimed ? 0 : detail.needsReview ? 1 : 2;
  for (const detail of details) {
    const key = getCanonicalSkill(detail.name);
    if (!key) continue;
    const next = { ...detail, name: canonicalSkillLabel(detail.name), evidence: cvEvidence(detail.evidence) };
    const previous = unique.get(key);
    if (!previous || rank(next) > rank(previous) || (rank(next) === rank(previous) && !previous.evidence && next.evidence)) unique.set(key, next);
  }
  return [...unique.values()];
}
