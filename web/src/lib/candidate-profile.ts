import { cvEvidence } from "./cv-evidence.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseGpaValue } from "./gpa.ts";

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
  const targetRole = profile.data.target_role || "";
  const relevant = !activeResume.experience_target_role || activeResume.experience_target_role === targetRole;
  return {
    activeResume, targetRole,
    skills: rows.flatMap((r) => r.skills?.name ? [r.skills.name] : []),
    claimedSkills: rows.filter((r) => r.is_claimed_by_user).flatMap((r) => r.skills?.name ? [r.skills.name] : []),
    reviewSkills: rows.filter((r) => r.needs_review).flatMap((r) => r.skills?.name ? [r.skills.name] : []),
    evidence: Object.fromEntries(rows.filter((r) => r.skills?.name && cvEvidence(r.evidence)).map((r) => [r.skills!.name, r.evidence!])),
    years: relevant && activeResume.experience_years != null ? Number(activeResume.experience_years) : null,
    education: String(activeResume.education || ""), gpa: parseGpaValue(activeResume.gpa as number | string | null),
  };
}
