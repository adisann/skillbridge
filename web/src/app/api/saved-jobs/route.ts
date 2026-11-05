import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, serviceKey);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "00000000-0000-0000-0000-000000000001";

    const supabase = getServiceSupabase();

    // 1. Ambil seluruh saved_jobs untuk user
    const { data: savedRows, error: savedErr } = await supabase
      .from("saved_jobs")
      .select("job_id, created_at")
      .eq("user_id", userId)
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

    // 3. Ambil data match
    const { data: matches } = await supabase
      .from("matches")
      .select("job_id, match_status, score, factors_supporting, factors_limiting")
      .eq("user_id", userId)
      .in("job_id", jobIds);

    const matchMap = new Map();
    if (matches) {
      for (const m of matches) {
        matchMap.set(m.job_id, m);
      }
    }

    const savedJobs = (jobs || []).map((j: Record<string, unknown>) => {
      const m = matchMap.get(j.id as string);
      const reqSkills: string[] = [];
      const prefSkills: string[] = [];

      for (const js of (j.job_skills as unknown as Array<{ is_mandatory: boolean; skills: { name: string } }>) || []) {
        if (js.skills?.name) {
          if (js.is_mandatory) reqSkills.push(js.skills.name);
          else prefSkills.push(js.skills.name);
        }
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
        matchScore: m ? Number(m.score) : 75,
        matchStatus: m ? m.match_status : "match",
        matchedSkills: reqSkills.slice(0, 3),
        missingSkills: reqSkills.slice(3, 5),
        factorsSupporting: m ? m.factors_supporting : [],
        factorsLimiting: m ? m.factors_limiting : [],
      };
    });

    return NextResponse.json({
      savedJobs,
      savedJobIds: jobIds,
    });
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
    const body = await req.json();
    const { jobId, userId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "jobId wajib disertakan" }, { status: 400 });
    }

    const effectiveUserId = userId || "00000000-0000-0000-0000-000000000001";
    const supabase = getServiceSupabase();

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

