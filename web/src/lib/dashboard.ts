import { isOverseasLocation } from "@/lib/utils";
import type { JobStage, TrackedJob } from "@/types/tracker";
import type { JobListItem } from "@/types/job";

export type DashboardJob = Pick<
  JobListItem,
  "id" | "title" | "company" | "location" | "canonicalTitle" | "matchScore" | "matchStatus" | "matchedSkills" | "missingSkills"
>;

export interface MarketSkill {
  skillName: string;
  percentage: number;
}

export interface DashboardRecommendation {
  skillName: string;
  demandPercentage: number;
  reason: string;
  priority: string;
}

export interface MissingSkill {
  skillName: string;
  frequency: number;
  percentage: number;
}

const MAX_MISSING_SKILLS = 3;

export function countJobsByStage(trackedJobs: TrackedJob[]): Record<JobStage, number> {
  const counts: Record<JobStage, number> = {
    bookmarked: 0,
    applying: 0,
    applied: 0,
    interviewing: 0,
    offered: 0,
    accepted: 0,
    rejected: 0,
  };
  for (const job of trackedJobs) {
    if (counts[job.stage] !== undefined) counts[job.stage] += 1;
  }
  return counts;
}

/** Rekomendasi: tanpa lowongan luar negeri, diutamakan bidang target, lalu skor match tertinggi. */
export function rankRecommendedJobs(jobs: DashboardJob[], targetRole?: string): DashboardJob[] {
  const target = targetRole?.toLowerCase() || "";
  let candidates = jobs.filter((j) => !isOverseasLocation(j.location));
  if (target && target !== "all" && target !== "semua bidang") {
    const inTarget = candidates.filter(
      (j) => j.canonicalTitle?.toLowerCase().includes(target) || j.title?.toLowerCase().includes(target)
    );
    if (inTarget.length > 0) candidates = inTarget;
  }
  return [...candidates].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

interface MissingSkillsInput {
  cvSkills: string[];
  rankedJobs: DashboardJob[];
  allJobs: DashboardJob[];
  recommendations: DashboardRecommendation[];
}

/** Maksimal 3 skill yang sering diminta di bidang target namun belum ada di CV. */
export function findMissingTargetSkills({
  cvSkills,
  rankedJobs,
  allJobs,
  recommendations,
}: MissingSkillsInput): MissingSkill[] {
  if (cvSkills.length === 0) return [];

  const cvLower = new Set(cvSkills.map((s) => s.toLowerCase().trim()));
  const skillCounts = new Map<string, number>();
  const targetJobs = rankedJobs.length > 0 ? rankedJobs : allJobs;

  for (const job of targetJobs) {
    for (const skill of job.missingSkills ?? []) {
      const key = skill.trim();
      if (key && !cvLower.has(key.toLowerCase())) {
        skillCounts.set(key, (skillCounts.get(key) || 0) + 1);
      }
    }
  }

  if (skillCounts.size === 0) {
    for (const rec of recommendations) {
      const key = rec.skillName?.trim();
      if (key && !cvLower.has(key.toLowerCase())) {
        skillCounts.set(key, Math.round((rec.demandPercentage * targetJobs.length) / 100) || 1);
      }
    }
  }

  return Array.from(skillCounts.entries())
    .map(([skillName, frequency]) => ({
      skillName,
      frequency,
      percentage: targetJobs.length > 0 ? Math.round((frequency / targetJobs.length) * 100) : 0,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, MAX_MISSING_SKILLS);
}
