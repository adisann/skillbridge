import { getCanonicalSkill } from "./matching-config.ts";
import { canonicalSkillLabel } from "./skill-taxonomy.ts";

interface JobSkill {
  is_mandatory: boolean;
  requirement_snippet?: string | null;
  skills?: { name: string; category?: string } | null;
}

/** Satu skill kanonis dihitung satu kali per posting, meski ada nama terjemahannya. */
export function canonicalSkillFrequencies(jobs: Array<{ job_skills?: JobSkill[] | null }>) {
  const counts: Record<string, { name: string; count: number; mandatoryCount: number; category: string; snippet: string }> = {};
  for (const job of jobs) {
    const unique = new Map<string, JobSkill>();
    for (const row of job.job_skills || []) {
      if (!row.skills?.name) continue;
      const key = getCanonicalSkill(row.skills.name);
      if (!unique.has(key) || row.is_mandatory) unique.set(key, row);
    }
    for (const [key, row] of unique) {
      const name = canonicalSkillLabel(row.skills!.name);
      counts[key] ??= { name, count: 0, mandatoryCount: 0, category: row.skills?.category || "Umum", snippet: row.requirement_snippet || `Persyaratan kualifikasi ${name}` };
      counts[key].count++;
      if (row.is_mandatory) counts[key].mandatoryCount++;
    }
  }
  return counts;
}
