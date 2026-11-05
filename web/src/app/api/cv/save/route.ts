import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateJobMatch } from "@/lib/matching";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, serviceKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      filename,
      fileUrl,
      r2Key,
      education,
      experienceYears,
      summary,
      skills,
    } = body;

    const effectiveUserId = userId || "00000000-0000-0000-0000-000000000001"; // Fallback to demo juri user

    const supabase = getServiceSupabase();

    // 1. Simpan atau perbarui resume di tabel `resumes`
    const { data: existingResume } = await supabase
      .from("resumes")
      .select("id")
      .eq("user_id", effectiveUserId)
      .eq("is_active", true)
      .limit(1);

    let resumeId: string;

    if (existingResume && existingResume.length > 0) {
      resumeId = existingResume[0].id;
      await supabase
        .from("resumes")
        .update({
          filename: filename || "CV_Terunggah.pdf",
          file_url: fileUrl || null,
          parsed_text: summary || "Ringkasan profil kompetensi",
          education: education || "Sarjana (S1)",
          experience_years: Number(experienceYears) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resumeId);
    } else {
      const { data: newResume, error: resumeErr } = await supabase
        .from("resumes")
        .insert({
          user_id: effectiveUserId,
          filename: filename || "CV_Terunggah.pdf",
          file_url: fileUrl || null,
          parsed_text: summary || "Ringkasan profil kompetensi",
          education: education || "Sarjana (S1)",
          experience_years: Number(experienceYears) || 0,
          is_active: true,
        })
        .select("id")
        .single();

      if (resumeErr || !newResume) {
        throw new Error("Gagal menyimpan resume: " + resumeErr?.message);
      }
      resumeId = newResume.id;
    }

    // 2. Hubungkan skill pengguna ke tabel `resume_skills`
    // Hapus skill lama untuk resume ini
    await supabase.from("resume_skills").delete().eq("resume_id", resumeId);

    for (const skillName of skills || []) {
      // Pastikan skill ada di master skills
      let skillId: string | null = null;
      const { data: foundSkill } = await supabase
        .from("skills")
        .select("id")
        .ilike("name", skillName.trim())
        .limit(1);

      if (foundSkill && foundSkill.length > 0) {
        skillId = foundSkill[0].id;
      } else {
        const { data: createdSkill } = await supabase
          .from("skills")
          .insert({ name: skillName.trim(), category: "Data & Analytics" })
          .select("id")
          .single();
        if (createdSkill) skillId = createdSkill.id;
      }

      if (skillId) {
        await supabase.from("resume_skills").upsert({
          resume_id: resumeId,
          skill_id: skillId,
          is_claimed_by_user: true,
          evidence: "Hasil ekstraksi dokumen CV yang dikonfirmasi oleh pengguna.",
        }, { onConflict: "resume_id,skill_id" });
      }
    }

    // 3. Kalkulasi Kecocokan dengan Seluruh Lowongan Aktif
    const { data: activeJobs } = await supabase
      .from("jobs")
      .select("id, title, canonical_title, company, location, experience_years_min, education, seniority, job_skills(is_mandatory, skills(name))")
      .eq("is_active", true);

    let matchCount = 0;
    if (activeJobs && activeJobs.length > 0) {
      for (const job of activeJobs) {
        const reqSkills: string[] = [];
        const prefSkills: string[] = [];

        for (const js of (job.job_skills as unknown as Array<{ is_mandatory: boolean; skills: { name: string } }>) || []) {
          const sName = js.skills?.name;
          if (sName) {
            if (js.is_mandatory) reqSkills.push(sName);
            else prefSkills.push(sName);
          }
        }

        const matchResult = calculateJobMatch(
          skills || [],
          Number(experienceYears) || 0,
          education || "S1",
          {
            title: job.title,
            requiredSkills: reqSkills,
            preferredSkills: prefSkills,
            experienceYearsMin: job.experience_years_min,
            education: job.education,
            seniority: job.seniority,
          }
        );

        await supabase.from("matches").upsert({
          user_id: effectiveUserId,
          resume_id: resumeId,
          job_id: job.id,
          match_status: matchResult.matchStatus,
          score: matchResult.score,
          score_breakdown: {
            breakdown: matchResult.breakdown,
            requirementsEvaluation: matchResult.requirementsEvaluation,
            matchedSkills: matchResult.matchedSkills,
            missingSkills: matchResult.missingSkills,
            unprovenSkills: matchResult.unprovenSkills,
          },
          factors_supporting: matchResult.factorsSupporting,
          factors_limiting: matchResult.factorsLimiting,
        }, { onConflict: "resume_id,job_id" });

        matchCount++;
      }
    }

    return NextResponse.json({
      success: true,
      resumeId,
      matchCount,
      r2Key,
      message: `CV berhasil disimpan dan ${matchCount} kecocokan lowongan berhasil dihitung.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal menyimpan data CV: " + (err.message || "Kesalahan server") },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "00000000-0000-0000-0000-000000000001";
    const supabase = getServiceSupabase();

    const { data: resumes, error } = await supabase
      .from("resumes")
      .select("id, filename, file_url, education, experience_years, parsed_text, resume_skills(skills(name))")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1);

    if (error) throw new Error(error.message);
    if (!resumes || resumes.length === 0) {
      return NextResponse.json({ resume: null });
    }

    const r = resumes[0];
    const skills: string[] = [];
    if (r.resume_skills) {
      for (const rs of r.resume_skills as unknown as Array<{ skills: { name: string } }>) {
        if (rs.skills?.name) skills.push(rs.skills.name);
      }
    }

    return NextResponse.json({
      resume: {
        id: r.id,
        filename: r.filename,
        fileUrl: r.file_url,
        education: r.education,
        experienceYears: r.experience_years,
        summary: r.parsed_text,
        skills,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
