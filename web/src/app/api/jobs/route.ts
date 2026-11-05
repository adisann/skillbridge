import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateJobMatch } from "@/lib/matching";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, serviceKey);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const query = searchParams.get("q");
    const userId = searchParams.get("userId") || "00000000-0000-0000-0000-000000000001";

    const supabase = getServiceSupabase();

    // 1. Ambil lowongan aktif dari Supabase
    let dbQuery = supabase
      .from("jobs")
      .select("*, job_skills(is_mandatory, skills(name))")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (role && role !== "all") {
      dbQuery = dbQuery.ilike("canonical_title", `%${role}%`);
    }
    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,company.ilike.%${query}%,location.ilike.%${query}%`);
    }

    const { data: jobs, error: jobsErr } = await dbQuery;
    if (jobsErr) {
      throw new Error(jobsErr.message);
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

    // 3. Ambil data matches tersimpan
    const { data: matches } = await supabase
      .from("matches")
      .select("job_id, match_status, score, factors_supporting, factors_limiting, score_breakdown")
      .eq("user_id", userId);

    const matchMap = new Map();
    if (matches) {
      for (const m of matches) {
        matchMap.set(m.job_id, m);
      }
    }

    // Format lowongan dengan perhitungan hybrid matching
    const formattedJobs = (jobs || []).map((j: Record<string, unknown>) => {
      const m = matchMap.get(j.id as string);
      const reqSkills: string[] = [];
      const prefSkills: string[] = [];

      for (const js of (j.job_skills as unknown as Array<{ is_mandatory: boolean; skills: { name: string } }>) || []) {
        if (js.skills?.name) {
          if (js.is_mandatory) reqSkills.push(js.skills.name);
          else prefSkills.push(js.skills.name);
        }
      }

      // Hitung atau ambil data matching
      let matchScore = 70;
      let matchStatus = "match";
      let matchedSkills: string[] = [];
      let missingSkills: string[] = [];
      let unprovenSkills: string[] = [];
      let factorsSupporting: string[] = [];
      let factorsLimiting: string[] = [];
      let scoreBreakdown: unknown[] = [];
      let requirementsEvaluation: unknown[] = [];

      // Jika ada resume aktif, hitung secara dinamis atau ekstrak dari cache DB
      if (activeResume) {
        const liveMatch = calculateJobMatch(
          candidateSkills,
          candidateYears,
          candidateEdu,
          {
            title: j.title as string,
            canonicalTitle: j.canonical_title as string,
            requiredSkills: reqSkills,
            preferredSkills: prefSkills,
            experienceYearsMin: (j.experience_years_min as number) || null,
            education: (j.education as string) || null,
            seniority: (j.seniority as string) || null,
          }
        );

        matchScore = m ? Number(m.score) : liveMatch.score;
        matchStatus = m ? m.match_status : liveMatch.matchStatus;
        matchedSkills = liveMatch.matchedSkills;
        missingSkills = liveMatch.missingSkills;
        unprovenSkills = liveMatch.unprovenSkills;
        factorsSupporting = m?.factors_supporting?.length ? m.factors_supporting : liveMatch.factorsSupporting;
        factorsLimiting = m?.factors_limiting?.length ? m.factors_limiting : liveMatch.factorsLimiting;
        scoreBreakdown = liveMatch.breakdown;
        requirementsEvaluation = liveMatch.requirementsEvaluation;
      } else if (m) {
        matchScore = Number(m.score);
        matchStatus = m.match_status;
        factorsSupporting = m.factors_supporting || [];
        factorsLimiting = m.factors_limiting || [];
        scoreBreakdown = Array.isArray(m.score_breakdown) ? m.score_breakdown : (m.score_breakdown as Record<string, unknown>)?.breakdown as unknown[] || [];
      } else {
        matchScore = 0;
        matchStatus = "insufficient_evidence";
        factorsLimiting = ["CV belum terunggah. Unggah CV untuk mengevaluasi kecocokan kualifikasi."];
        factorsSupporting = ["Data lowongan resmi terverifikasi."];
      }

      return {
        id: j.id,
        externalId: j.external_id,
        title: j.title,
        canonicalTitle: j.canonical_title,
        company: j.company,
        location: j.location,
        employmentType: j.employment_type,
        seniority: j.seniority || "Mid",
        experienceYearsMin: j.experience_years_min || 1,
        education: j.education || "Bachelor",
        description: j.description,
        sourceName: j.source_name,
        sourceUrl: j.source_url,
        retrievalMethod: j.retrieval_method,
        retrievedAt: j.retrieved_at,
        requiredSkills: reqSkills,
        preferredSkills: prefSkills,
        matchScore,
        matchStatus,
        matchedSkills,
        missingSkills,
        unprovenSkills,
        factorsSupporting,
        factorsLimiting,
        scoreBreakdown,
        requirementsEvaluation,
      };
    });

    return NextResponse.json({
      jobs: formattedJobs,
      total: formattedJobs.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Gagal memuat lowongan" }, { status: 500 });
  }
}

// POST: Admin Import (Tambah manual atau impor CSV lewat pipeline yang sama)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, company, location, canonicalTitle, seniority, experienceYearsMin, education, description, requiredSkills, preferredSkills, sourceUrl } = body;

    if (!title || !company || !description) {
      return NextResponse.json({ error: "Judul, nama perusahaan, dan deskripsi wajib diisi." }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Cleaning & Hash
    const cleanedDesc = description.replace(/<[^>]*>?/gm, "").trim();
    const payload = `${title.trim().toLowerCase()}|${company.trim().toLowerCase()}|${cleanedDesc}`;
    
    // Simple SHA-256 in web
    const crypto = await import("crypto");
    const contentHash = crypto.createHash("sha256").update(payload).digest("hex");
    const externalId = `admin-${Date.now()}`;

    // 2. Simpan lowongan ke tabel `jobs`
    const { data: insertedJob, error: jobErr } = await supabase
      .from("jobs")
      .insert({
        source_name: "admin_import",
        external_id: externalId,
        source_url: sourceUrl || "https://skillbridge.id/admin",
        title: title.trim(),
        canonical_title: canonicalTitle || (title.toLowerCase().includes("bi") ? "BI Analyst" : "Data Analyst"),
        company: company.trim(),
        location: location || "Indonesia (Remote / Hybrid)",
        employment_type: "Full-time",
        seniority: seniority || "Mid",
        experience_years_min: Number(experienceYearsMin) || 1,
        education: education || "Bachelor",
        description: cleanedDesc,
        content_hash: contentHash,
        retrieval_method: "admin_import",
        is_active: true,
      })
      .select("id")
      .single();

    if (jobErr || !insertedJob) {
      throw new Error("Gagal menyimpan lowongan: " + jobErr?.message);
    }

    const jobId = insertedJob.id;

    // 3. Hubungkan ke job_skills
    const allSkills = [
      ...(requiredSkills || []).map((s: string) => ({ name: s, is_mandatory: true })),
      ...(preferredSkills || []).map((s: string) => ({ name: s, is_mandatory: false })),
    ];

    for (const item of allSkills) {
      const sName = item.name.trim();
      let skillId: string | null = null;
      const { data: found } = await supabase.from("skills").select("id").ilike("name", sName).limit(1);
      if (found && found.length > 0) {
        skillId = found[0].id;
      } else {
        const { data: ins } = await supabase.from("skills").insert({ name: sName, category: "Data & Analytics" }).select("id").single();
        if (ins) skillId = ins.id;
      }

      if (skillId) {
        await supabase.from("job_skills").upsert({
          job_id: jobId,
          skill_id: skillId,
          is_mandatory: item.is_mandatory,
          requirement_snippet: `Kualifikasi ${item.is_mandatory ? 'wajib' : 'tambahan'} ${sName}`,
        }, { onConflict: "job_id,skill_id" });
      }
    }

    // 4. Update matches dengan resume aktif yang ada
    const { data: resumes } = await supabase.from("resumes").select("id, user_id, education, experience_years, resume_skills(skills(name))").eq("is_active", true);
    if (resumes) {
      for (const r of resumes) {
        const candidateSkills = (r.resume_skills as unknown as Array<{ skills: { name: string } }>)?.map((s) => s.skills?.name).filter(Boolean) || [];
        const matchRes = calculateJobMatch(
          candidateSkills,
          r.experience_years || 0,
          r.education || "S1",
          {
            title,
            requiredSkills: requiredSkills || [],
            preferredSkills: preferredSkills || [],
            experienceYearsMin: Number(experienceYearsMin) || 1,
            education: education || "Bachelor",
            seniority: seniority || "Mid",
          }
        );

        await supabase.from("matches").upsert({
          user_id: r.user_id,
          resume_id: r.id,
          job_id: jobId,
          match_status: matchRes.matchStatus,
          score: matchRes.score,
          score_breakdown: matchRes.breakdown,
          factors_supporting: matchRes.factorsSupporting,
          factors_limiting: matchRes.factorsLimiting,
        }, { onConflict: "resume_id,job_id" });
      }
    }

    return NextResponse.json({
      success: true,
      jobId,
      message: `Lowongan '${title}' berhasil disimpan melalui pipeline dan dipublikasikan ke katalog.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Gagal memproses import lowongan" }, { status: 500 });
  }
}

// PUT: Admin Edit Lowongan
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, company, location, canonicalTitle, seniority, experienceYearsMin, education, description, requiredSkills, preferredSkills } = body;

    if (!id || !title || !company) {
      return NextResponse.json({ error: "ID, judul, dan nama perusahaan wajib diisi." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const cleanedDesc = (description || "").replace(/<[^>]*>?/gm, "").trim();

    // 1. Update jobs table
    const { error: updateErr } = await supabase
      .from("jobs")
      .update({
        title: title.trim(),
        company: company.trim(),
        location: location || "Indonesia (Remote / Hybrid)",
        canonical_title: canonicalTitle || (title.toLowerCase().includes("bi") ? "BI Analyst" : "Data Analyst"),
        seniority: seniority || "Mid",
        experience_years_min: Number(experienceYearsMin) || 1,
        education: education || "Bachelor",
        description: cleanedDesc,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) throw new Error(updateErr.message);

    // 2. Hubungkan ulang job_skills jika ada perubahan skills
    if (requiredSkills || preferredSkills) {
      await supabase.from("job_skills").delete().eq("job_id", id);

      const allSkills = [
        ...(requiredSkills || []).map((s: string) => ({ name: s, is_mandatory: true })),
        ...(preferredSkills || []).map((s: string) => ({ name: s, is_mandatory: false })),
      ];

      for (const item of allSkills) {
        const sName = item.name.trim();
        let skillId: string | null = null;
        const { data: found } = await supabase.from("skills").select("id").ilike("name", sName).limit(1);
        if (found && found.length > 0) {
          skillId = found[0].id;
        } else {
          const { data: ins } = await supabase.from("skills").insert({ name: sName, category: "Data & Analytics" }).select("id").single();
          if (ins) skillId = ins.id;
        }

        if (skillId) {
          await supabase.from("job_skills").upsert({
            job_id: id,
            skill_id: skillId,
            is_mandatory: item.is_mandatory,
            requirement_snippet: `Kualifikasi ${item.is_mandatory ? 'wajib' : 'tambahan'} ${sName}`,
          }, { onConflict: "job_id,skill_id" });
        }
      }

      // 3. Update matches dengan resume aktif yang ada
      const { data: resumes } = await supabase.from("resumes").select("id, user_id, education, experience_years, resume_skills(skills(name))").eq("is_active", true);
      if (resumes) {
        for (const r of resumes) {
          const candidateSkills = (r.resume_skills as unknown as Array<{ skills: { name: string } }>)?.map((s) => s.skills?.name).filter(Boolean) || [];
          const matchRes = calculateJobMatch(
            candidateSkills,
            r.experience_years || 0,
            r.education || "S1",
            {
              title,
              canonicalTitle: canonicalTitle || (title.toLowerCase().includes("bi") ? "BI Analyst" : "Data Analyst"),
              requiredSkills: requiredSkills || [],
              preferredSkills: preferredSkills || [],
              experienceYearsMin: Number(experienceYearsMin) || 1,
              education: education || "Bachelor",
              seniority: seniority || "Mid",
            }
          );

          await supabase.from("matches").upsert({
            user_id: r.user_id,
            resume_id: r.id,
            job_id: id,
            match_status: matchRes.matchStatus,
            score: matchRes.score,
            score_breakdown: matchRes.breakdown,
            factors_supporting: matchRes.factorsSupporting,
            factors_limiting: matchRes.factorsLimiting,
          }, { onConflict: "resume_id,job_id" });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Lowongan '${title}' berhasil diperbarui.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Gagal memperbarui lowongan" }, { status: 500 });
  }
}

// DELETE: Admin Hapus Lowongan
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let jobId = searchParams.get("id");

    if (!jobId) {
      const body = await req.json().catch(() => ({}));
      jobId = body.id;
    }

    if (!jobId) {
      return NextResponse.json({ error: "ID lowongan wajib disertakan." }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Hapus dari tabel jobs (otomatis cascading ke job_skills, matches, saved_jobs)
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "Lowongan berhasil dihapus dari basis data.",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Gagal menghapus lowongan" }, { status: 500 });
  }
}
