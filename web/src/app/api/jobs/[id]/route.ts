import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { calculateJobMatch, getDisplayScore } from "@/lib/matching";
import { getCategoryFromTitle } from "@/lib/job-categories";
import { loadCandidateProfile } from "@/lib/candidate-profile";
import { splitJobSkills, type JobSkillRow } from "@/lib/job-skills";

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
    const {
      activeResume,
      skills: candidateSkills,
      years: candidateYears,
      education: candidateEdu,
    } = await loadCandidateProfile(supabase, user?.id ?? null);

    const { required: reqSkills, preferred: prefSkills } = splitJobSkills(
      job.job_skills as unknown as JobSkillRow[] | null
    );

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

    const jobCat = getCategoryFromTitle(job.title, job.canonical_title);
    const correctedCanonicalTitle =
      job.canonical_title === "BI Analyst" && /\bbusiness analyst\b/i.test(job.title)
        ? "Business Analyst"
        : job.canonical_title;

    return NextResponse.json({
      job: {
        id: job.id,
        externalId: job.external_id,
        title: job.title,
        canonicalTitle: correctedCanonicalTitle,
        category: jobCat.slug,
        categoryLabel: jobCat.label,
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
        matchScore: activeResume ? getDisplayScore(liveMatch) : null,
        matchStatus: activeResume ? liveMatch.matchStatus : "insufficient_evidence",
        matchedSkills: activeResume ? liveMatch.matchedSkills : [],
        missingSkills: activeResume ? liveMatch.missingSkills : reqSkills,
        unprovenSkills: activeResume ? liveMatch.unprovenSkills : [],
        factorsSupporting: activeResume ? liveMatch.factorsSupporting : ["Data lowongan resmi aktif."],
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

