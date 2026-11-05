import { NextRequest, NextResponse } from "next/server";
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
      .select("id, title, company, location, employment_type, seniority, source_name, source_url, job_skills(is_mandatory, skills(name))")
      .in("id", jobIds);

    if (jobsErr) throw new Error(jobsErr.message);

    // 3. Ambil data match dan resume aktif untuk evaluasi akurat
    const [{ data: matches }, { data: userResumes }] = await Promise.all([
      supabase
        .from("matches")
        .select("job_id, match_status, score, factors_supporting, factors_limiting, score_breakdown")
        .eq("user_id", effectiveUserId)
        .in("job_id", jobIds),
      supabase
        .from("resumes")
        .select("id, resume_skills(skills(name))")
        .eq("user_id", effectiveUserId)
        .eq("is_active", true)
        .limit(1),
    ]);

    const userSkillSet = new Set<string>();
    if (userResumes && userResumes.length > 0) {
      for (const rs of (userResumes[0].resume_skills as unknown as Array<{ skills: { name: string } }>) || []) {
        if (rs.skills?.name) userSkillSet.add(rs.skills.name.toLowerCase());
      }
    }

    const matchMap = new Map();
    if (matches) {
      for (const m of matches) {
        matchMap.set(m.job_id, m);
      }
    }

    const savedJobs = (jobs || []).map((j: Record<string, unknown>) => {
      const m = matchMap.get(j.id as string);
      const reqSkills: string[] = [];

      for (const js of (j.job_skills as unknown as Array<{ is_mandatory: boolean; skills: { name: string } }>) || []) {
        if (js.skills?.name && js.is_mandatory) {
          reqSkills.push(js.skills.name);
        }
      }

      let matchedSkills: string[] = [];
      let missingSkills: string[] = [];

      const breakdownData = m?.score_breakdown as { matchedSkills?: string[]; missingSkills?: string[] } | undefined;
      if (breakdownData?.matchedSkills) {
        matchedSkills = breakdownData.matchedSkills;
        missingSkills = breakdownData.missingSkills || [];
      } else if (userSkillSet.size > 0) {
        matchedSkills = reqSkills.filter((s) => userSkillSet.has(s.toLowerCase()));
        missingSkills = reqSkills.filter((s) => !userSkillSet.has(s.toLowerCase()));
      } else {
        matchedSkills = [];
        missingSkills = reqSkills;
      }

      return {
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        employmentType: j.employment_type,
        seniority: j.seniority || "Mid",
        sourceName: j.source_name,
        sourceUrl: j.source_url,
        matchScore: m
          ? m.match_status === "insufficient_evidence"
            ? null
            : Number(m.score)
          : userSkillSet.size > 0
          ? 50
          : 0,
        matchStatus: m ? m.match_status : userSkillSet.size > 0 ? "underqualified" : "insufficient_evidence",
        matchedSkills,
        missingSkills,
        factorsSupporting: m ? m.factors_supporting : [],
        factorsLimiting: m ? m.factors_limiting : [],
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
