import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateJobMatch } from "@/lib/matching";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, serviceKey);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await context.params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "00000000-0000-0000-0000-000000000001";

    const supabase = getServiceSupabase();

    // 1. Ambil detail lowongan
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("*, job_skills(is_mandatory, skills(name))")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Lowongan tidak ditemukan" }, { status: 404 });
    }

    // 2. Ambil resume aktif pengguna jika ada
    const { data: resumeRows } = await supabase
      .from("resumes")
      .select("id, experience_years, education, resume_skills(skills(name))")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1);

    const activeResume = resumeRows && resumeRows.length > 0 ? resumeRows[0] : null;
    const candidateSkills: string[] = [];
    if (activeResume && activeResume.resume_skills) {
      for (const rs of activeResume.resume_skills as unknown as Array<{ skills: { name: string } }>) {
        if (rs.skills?.name) candidateSkills.push(rs.skills.name);
      }
    }
    const candidateYears = activeResume ? Number(activeResume.experience_years) || 0 : 0;
    const candidateEdu = activeResume ? activeResume.education || "Sarjana (S1)" : "Sarjana (S1)";

    // 3. Ambil data match dari tabel matches
    const { data: match } = await supabase
      .from("matches")
      .select("match_status, score, factors_supporting, factors_limiting, score_breakdown")
      .eq("user_id", userId)
      .eq("job_id", jobId)
      .single();

    const reqSkills: string[] = [];
    const prefSkills: string[] = [];
    for (const js of (job.job_skills as unknown as Array<{ is_mandatory: boolean; skills: { name: string } }>) || []) {
      if (js.skills?.name) {
        if (js.is_mandatory) reqSkills.push(js.skills.name);
        else prefSkills.push(js.skills.name);
      }
    }

    // Hitung live hybrid matching
    const liveMatch = calculateJobMatch(
      candidateSkills,
      candidateYears,
      candidateEdu,
      {
        title: job.title,
        canonicalTitle: job.canonical_title,
        requiredSkills: reqSkills,
        preferredSkills: prefSkills,
        experienceYearsMin: job.experience_years_min || null,
        education: job.education || null,
        seniority: job.seniority || null,
      }
    );

    return NextResponse.json({
      job: {
        id: job.id,
        externalId: job.external_id,
        title: job.title,
        canonicalTitle: job.canonical_title,
        company: job.company,
        location: job.location,
        employmentType: job.employment_type,
        seniority: job.seniority || "Mid",
        experienceYearsMin: job.experience_years_min || 1,
        education: job.education || "Bachelor",
        description: job.description,
        sourceName: job.source_name,
        sourceUrl: job.source_url,
        retrievalMethod: job.retrieval_method,
        retrievedAt: job.retrieved_at,
        requiredSkills: reqSkills,
        preferredSkills: prefSkills,
        matchScore: match ? Number(match.score) : liveMatch.score,
        matchStatus: match ? match.match_status : liveMatch.matchStatus,
        matchedSkills: liveMatch.matchedSkills,
        missingSkills: liveMatch.missingSkills,
        unprovenSkills: liveMatch.unprovenSkills,
        factorsSupporting: match?.factors_supporting?.length ? match.factors_supporting : liveMatch.factorsSupporting,
        factorsLimiting: match?.factors_limiting?.length ? match.factors_limiting : liveMatch.factorsLimiting,
        scoreBreakdown: liveMatch.breakdown,
        requirementsEvaluation: liveMatch.requirementsEvaluation,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal memuat lowongan: " + (err.message || "Kesalahan server") },
      { status: 500 }
    );
  }
}

