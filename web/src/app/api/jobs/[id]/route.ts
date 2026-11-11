import { displayCompany, isDemoJob } from "@/lib/demo-jobs";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { calculateJobMatch, getDisplayScore } from "@/lib/matching";
import { getCategoryFromTitle } from "@/lib/job-categories";
import { loadCandidateProfile, toMatchCandidate } from "@/lib/candidate-profile";
import { toMatchJob } from "@/lib/job-skills";

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

    if (jobErr || !job || isDemoJob(job)) {
      return NextResponse.json({ error: "Lowongan tidak ditemukan" }, { status: 404 });
    }

    // 2. Ambil resume aktif pengguna jika terautentikasi
    const candidate = await loadCandidateProfile(supabase, user?.id ?? null);
    const { activeResume } = candidate;
    const matchJob = toMatchJob(job);
    const liveMatch = calculateJobMatch(toMatchCandidate(candidate), matchJob);

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
        company: displayCompany(job.company),
        location: job.location,
        employmentType: job.employment_type,
        seniority: job.seniority || "",
        experienceYearsMin: matchJob.experienceYearsMin,
        education: matchJob.education,
        salaryMin: job.salary_min ?? null,
        salaryMax: job.salary_max ?? null,
        salaryCurrency: job.salary_currency ?? null,
        salaryPeriod: job.salary_period ?? null,
        minGpa: job.min_gpa ?? null,
        description: job.description,
        contentHash: job.content_hash || "default_hash",
        sourceName: job.source_name,
        sourceUrl: job.source_url,
        retrievalMethod: job.retrieval_method,
        retrievedAt: job.retrieved_at,
        expiresAt: job.expires_at || null,
        deadline: job.expires_at || null,
        requiredSkills: matchJob.requiredSkills,
        preferredSkills: matchJob.preferredSkills,
        matchScore: activeResume ? getDisplayScore(liveMatch) : null,
        matchStatus: activeResume ? liveMatch.matchStatus : "insufficient_evidence",
        matchStatusReason: activeResume ? liveMatch.matchStatusReason : "cv_data_incomplete",
        matchedSkills: activeResume ? liveMatch.matchedSkills : [],
        missingSkills: activeResume ? liveMatch.missingSkills : matchJob.requiredSkills,
        unprovenSkills: activeResume ? liveMatch.unprovenSkills : [],
        factorsSupporting: activeResume ? liveMatch.factorsSupporting : ["Lowongan aktif dari sumber yang tercantum."],
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

