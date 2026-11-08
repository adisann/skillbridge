import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, getServiceSupabase } from "@/lib/supabase/server";
import { splitJobSkills } from "@/lib/job-skills";
export async function GET(req: NextRequest) {
  const { admin, error, status } = await getAuthenticatedAdmin(req);
  if (!admin || error) return NextResponse.json({ error }, { status: status || 401 });
  const db = getServiceSupabase();
  const jobs = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await db.from("jobs").select("*, job_skills(is_mandatory, skills(name))").order("created_at", { ascending: false }).order("id").range(offset, offset + 999);
    if (result.error) return NextResponse.json({ error: "Gagal memuat lowongan." }, { status: 500 });
    jobs.push(...(result.data || []));
    if (!result.data || result.data.length < 1000) break;
  }
  return NextResponse.json({ jobs: jobs.map(j => {
    const skills = splitJobSkills(j.job_skills);
    return { id:j.id, title:j.title, company:j.company, location:j.location, canonicalTitle:j.canonical_title, seniority:j.seniority, experienceYearsMin:j.experience_years_min, education:j.education, description:j.description, employmentType:j.employment_type, sourceName:j.source_name, sourceUrl:j.source_url, retrievalMethod:j.retrieval_method, isActive:j.is_active, salaryMin:j.salary_min, salaryMax:j.salary_max, salaryCurrency:j.salary_currency, salaryPeriod:j.salary_period, requiredSkills:skills.required, preferredSkills:skills.preferred };
  }) }, { headers: { "Cache-Control": "private, no-store" } });
}
