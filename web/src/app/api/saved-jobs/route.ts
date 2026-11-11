import { NextRequest, NextResponse } from "next/server";
import { loadCandidateProfile, toMatchCandidate } from "@/lib/candidate-profile";
import { calculateJobMatch, getDisplayScore } from "@/lib/matching";
import { toMatchJob } from "@/lib/job-skills";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedUser(req);
    if (!user || authError) {
      return NextResponse.json(
        { error: "Sesi autentikasi tidak ditemukan. Silakan login terlebih dahulu untuk mengakses lowongan tersimpan." },
        { status: 401 }
      );
    }

    const effectiveUserId = user.id;

    // 1. Ambil seluruh saved_jobs untuk user aktif
    const { data: savedRows, error: savedErr } = await supabase
      .from("saved_jobs")
      .select("job_id, created_at")
      .eq("user_id", effectiveUserId)
      .order("created_at", { ascending: false });

    if (savedErr) throw new Error(savedErr.message);

    if (!savedRows || savedRows.length === 0) {
      return NextResponse.json({ savedJobs: [], savedJobIds: [] });
    }

    const jobIds = savedRows.map((r: { job_id: string }) => r.job_id);

    // 2. Ambil detail lowongan terkait
    const { data: jobs, error: jobsErr } = await supabase
      .from("jobs")
      .select("id, title, company, location, employment_type, seniority, source_name, source_url, canonical_title, description, experience_years_min, education, min_gpa, job_skills(is_mandatory, skills(name))")
      .in("id", jobIds);

    if (jobsErr) throw new Error(jobsErr.message);

    const candidate = await loadCandidateProfile(supabase, effectiveUserId);
    const savedJobs = (jobs || []).map((j: Record<string, unknown>) => {
      const matchJob = toMatchJob(j as unknown as Parameters<typeof toMatchJob>[0]);
      const m = candidate.activeResume ? calculateJobMatch(toMatchCandidate(candidate), matchJob) : null;

      return {
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        employmentType: j.employment_type,
        seniority: j.seniority || "",
        sourceName: j.source_name,
        sourceUrl: j.source_url,
        matchScore: m ? getDisplayScore(m) : null,
        matchStatus: m?.matchStatus || "insufficient_evidence",
        matchStatusReason: m?.matchStatusReason || (m ? null : "cv_data_incomplete"),
        matchedSkills: m?.matchedSkills || [], missingSkills: m?.missingSkills || matchJob.requiredSkills,
        factorsSupporting: m?.factorsSupporting || [], factorsLimiting: m?.factorsLimiting || [],
      };
    });

    const headers = new Headers();
    headers.set("Cache-Control", "private, no-store, must-revalidate");

    return NextResponse.json(
      {
        savedJobs,
        savedJobIds: jobIds,
      },
      { headers }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal memuat lowongan tersimpan: " + (err.message || "Kesalahan server") },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedUser(req);
    if (!user || authError) {
      return NextResponse.json(
        { error: "Sesi autentikasi tidak ditemukan. Silakan login terlebih dahulu untuk menyimpan lowongan." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "jobId wajib disertakan" }, { status: 400 });
    }

    const effectiveUserId = user.id;

    // Cek apakah sudah tersimpan
    const { data: existing } = await supabase
      .from("saved_jobs")
      .select("id")
      .eq("user_id", effectiveUserId)
      .eq("job_id", jobId)
      .limit(1);

    if (existing && existing.length > 0) {
      // Hapus (toggle off)
      await supabase
        .from("saved_jobs")
        .delete()
        .eq("user_id", effectiveUserId)
        .eq("job_id", jobId);

      return NextResponse.json({
        saved: false,
        jobId,
        message: "Lowongan berhasil dihapus dari daftar simpanan.",
      });
    } else {
      // Simpan (toggle on)
      const { data: inserted, error: insertErr } = await supabase
        .from("saved_jobs")
        .insert({
          user_id: effectiveUserId,
          job_id: jobId,
        })
        .select("*")
        .single();

      if (insertErr) throw new Error(insertErr.message);

      return NextResponse.json({
        saved: true,
        jobId,
        savedItem: inserted,
        message: "Lowongan berhasil disimpan ke My Progress.",
      });
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal menyimpan lowongan: " + (err.message || "Kesalahan server") },
      { status: 500 }
    );
  }
}
