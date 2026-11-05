import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase/server";
import { parseGpaValue } from "@/lib/gpa";

const DEFAULT_EDUCATION = "Sarjana (S1)";
const RESUME_COLUMNS = "id, experience_years, education, gpa, resume_skills(skills(name))";

interface CandidateProfile {
  activeResume: Record<string, unknown> | null;
  skills: string[];
  years: number;
  education: string;
  gpa: number | null;
}

const EMPTY_PROFILE: CandidateProfile = {
  activeResume: null,
  skills: [],
  years: 0,
  education: DEFAULT_EDUCATION,
  gpa: null,
};

async function fetchActiveResumeRows(db: SupabaseClient, userId: string) {
  const { data } = await db
    .from("resumes")
    .select(RESUME_COLUMNS)
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1);
  return data;
}

/** Resume aktif pengguna beserta skill, pengalaman, dan pendidikannya untuk perhitungan match. */
export async function loadCandidateProfile(
  supabase: SupabaseClient,
  userId: string | null
): Promise<CandidateProfile> {
  if (!userId) return EMPTY_PROFILE;

  let rows = await fetchActiveResumeRows(supabase, userId);
  if (!rows || rows.length === 0) {
    // Fallback ke service client bila RLS menyembunyikan resume milik pengguna
    rows = (await fetchActiveResumeRows(getServiceSupabase(), userId)) ?? rows;
  }

  const activeResume = rows && rows.length > 0 ? (rows[0] as unknown as Record<string, unknown>) : null;
  if (!activeResume) return EMPTY_PROFILE;

  const resumeSkills = (activeResume.resume_skills ?? []) as Array<{ skills: { name: string } | null }>;
  return {
    activeResume,
    skills: resumeSkills.flatMap((rs) => (rs.skills?.name ? [rs.skills.name] : [])),
    years: Number(activeResume.experience_years) || 0,
    education: (activeResume.education as string) || DEFAULT_EDUCATION,
    gpa: parseGpaValue(activeResume.gpa as number | string | null),
  };
}
