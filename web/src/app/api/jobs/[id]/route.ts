import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { calculateJobMatch } from "@/lib/matching";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await context.params;
    const { user, supabase } = await getAuthenticatedUser(req);

    // 1. Ambil detail lowongan
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("*, job_skills(is_mandatory, skills(name))")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Lowongan tidak ditemukan" }, { status: 404 });
    }

    // 2. Ambil resume aktif pengguna jika terautentikasi
    let activeResume: Record<string, unknown> | null = null;
    const candidateSkills: string[] = [];
    let candidateYears = 0;
    let candidateEdu = "Sarjana (S1)";

    if (user) {
      const { data: resumeRows } = await supabase
        .from("resumes")
        .select("id, experience_years, education, resume_skills(skills(name))")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1);

      activeResume = resumeRows && resumeRows.length > 0 ? (resumeRows[0] as unknown as Record<string, unknown>) : null;
      if (activeResume && activeResume.resume_skills) {
        for (const rs of activeResume.resume_skills as unknown as Array<{ skills: { name: string } }>) {
          if (rs.skills?.name) candidateSkills.push(rs.skills.name);
        }
      }
      candidateYears = activeResume ? Number(activeResume.experience_years) || 0 : 0;
      candidateEdu = activeResume ? (activeResume.education as string) || "Sarjana (S1)" : "Sarjana (S1)";
    }

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
        contentHash: job.content_hash || "default_hash",
        sourceName: job.source_name,
        sourceUrl: job.source_url,
        retrievalMethod: job.retrieval_method,
        retrievedAt: job.retrieved_at,
        expiresAt: job.expires_at || null,
        deadline: job.expires_at || null,
        requiredSkills: reqSkills,
        preferredSkills: prefSkills,
        matchScore: activeResume ? liveMatch.score : null,
        matchStatus: activeResume ? liveMatch.matchStatus : "insufficient_evidence",
        matchedSkills: activeResume ? liveMatch.matchedSkills : [],
        missingSkills: activeResume ? liveMatch.missingSkills : reqSkills,
        unprovenSkills: activeResume ? liveMatch.unprovenSkills : [],
        factorsSupporting: activeResume ? liveMatch.factorsSupporting : ["Data lowongan resmi terverifikasi."],
        factorsLimiting: activeResume ? liveMatch.factorsLimiting : ["CV belum terunggah. Unggah CV untuk mengevaluasi kecocokan."],
        scoreBreakdown: activeResume ? liveMatch.breakdown : [],
        requirementsEvaluation: activeResume ? liveMatch.requirementsEvaluation : [],
      },
    }, {
      headers: {
        "Cache-Control": user ? "private, no-store, must-revalidate" : "public, s-maxage=900, stale-while-revalidate=60",
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

