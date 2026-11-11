import { cvEvidence } from "./cv-evidence.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseGpaValue } from "./gpa.ts";
import { normalizeResumeSkills } from "./resume-skill-normalization.ts";

export interface CandidateProfile {
  activeResume: Record<string, unknown> | null;
  skills: string[];
  claimedSkills: string[];
  reviewSkills: string[];
  evidence: Record<string, string>;
  years: number | null;
  education: string;
  gpa: number | null;
  targetRole: string;
}
const EMPTY_PROFILE: CandidateProfile = { activeResume: null, skills: [], claimedSkills: [], reviewSkills: [], evidence: {}, years: null, education: "", gpa: null, targetRole: "" };

export async function loadCandidateProfile(supabase: SupabaseClient, userId: string | null): Promise<CandidateProfile> {
  if (!userId) return EMPTY_PROFILE;
  const [resume, profile] = await Promise.all([
    supabase.from("resumes").select("id, filename, updated_at, experience_years, experience_target_role, education, gpa, resume_skills(is_claimed_by_user, needs_review, evidence, skills(name))").eq("user_id", userId).eq("is_active", true).maybeSingle(),
    supabase.from("profiles").select("target_role").eq("id", userId).single(),
  ]);
  if (resume.error || profile.error) throw new Error("Gagal memuat CV dan target aktif.");
  if (!resume.data) return { ...EMPTY_PROFILE, targetRole: profile.data.target_role || "" };
  const activeResume = resume.data as unknown as Record<string, unknown>;
  const rows = (activeResume.resume_skills || []) as Array<{ skills: { name: string } | null; is_claimed_by_user: boolean; needs_review: boolean; evidence: string | null }>;
  const normalized = normalizeResumeSkills(rows.flatMap((r) => r.skills?.name ? [{ name: r.skills.name, claimed: r.is_claimed_by_user, needsReview: r.needs_review, evidence: cvEvidence(r.evidence) }] : []));
  const targetRole = profile.data.target_role || "";
  const relevant = !activeResume.experience_target_role || activeResume.experience_target_role === targetRole;
  return {
    activeResume, targetRole,
    skills: normalized.map((r) => r.name),
    claimedSkills: normalized.filter((r) => r.claimed).map((r) => r.name),
    reviewSkills: normalized.filter((r) => r.needsReview).map((r) => r.name),
    evidence: Object.fromEntries(normalized.filter((r) => r.evidence).map((r) => [r.name, r.evidence!])),
    years: relevant && activeResume.experience_years != null ? Number(activeResume.experience_years) : null,
    education: String(activeResume.education || ""), gpa: parseGpaValue(activeResume.gpa as number | string | null),
  };
}

/** Bentuk input kandidat untuk calculateJobMatch dari profil CV aktif. */
export function toMatchCandidate(profile: CandidateProfile) {
  return {
    skills: profile.skills,
    experienceYears: profile.years,
    education: profile.education,
    gpa: profile.gpa,
    targetRole: profile.targetRole,
    claimedSkills: profile.claimedSkills,
    reviewSkills: profile.reviewSkills,
    evidence: profile.evidence,
  };
}
