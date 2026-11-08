import { cvEvidence } from "@/lib/cv-evidence";
import { ownedResumeKey } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { parseGpaValue } from "@/lib/gpa";

export async function POST(req: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedUser(req);
    if (!user || authError) {
      return NextResponse.json(
        { error: "Sesi autentikasi tidak ditemukan. Silakan login terlebih dahulu untuk menyimpan CV." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      targetRole,
      filename,
      fileUrl,
      r2Key,
      education,
      gpa: rawGpa,
      experienceYears,
      summary,
      skills,
      manualSkills = [],
    } = body;

    const cleanSkills: string[] = Array.isArray(skills)
      ? skills.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      : [];
    if (cleanSkills.length === 0) {
      return NextResponse.json(
        { error: "CV belum memuat skill. Tambahkan minimal satu skill sebelum menyimpan." },
        { status: 400 }
      );
    }

    const gpa = parseGpaValue(rawGpa);
    const years = experienceYears == null || experienceYears === "" ? null : Number(experienceYears);
    if (years !== null && (!Number.isFinite(years) || years < 0 || years > 81)) {
      return NextResponse.json({ error: "Durasi pengalaman tidak valid." }, { status: 400 });
    }
    const ownedKey = ownedResumeKey(user.id, r2Key) ?? ownedResumeKey(user.id, fileUrl);
    const skillDetails = Array.isArray(body.skillDetails) ? body.skillDetails : [];
    const { data: resumeId, error: saveError } = await supabase.rpc("save_resume_profile", {
      p_resume_id: body.resumeId || null,
      p_filename: filename || "CV_Terunggah.pdf",
      p_file_url: ownedKey ? `r2://${ownedKey}` : null,
      p_education: education || null, p_gpa: gpa, p_years: years,
      p_experience_target: body.experienceTargetRole || null,
      p_summary: summary || "", p_target: targetRole || null,
      p_skills: cleanSkills.map((name) => {
        const detail = skillDetails.find((s: { name: string }) => s.name === name);
        return { name, claimed: manualSkills.includes(name), needsReview: detail?.needsReview ?? false,
          evidence: typeof detail?.evidence === "string" ? detail.evidence : null };
      }),
    });
    if (saveError) throw new Error(saveError.message);

    return NextResponse.json({
      success: true,
      resumeId,
      r2Key,
      message: "CV berhasil disimpan. Kecocokan dihitung dari CV dan target aktif saat membuka lowongan.",
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
    const { user, supabase, error: authError } = await getAuthenticatedUser(req);
    if (!user || authError) {
      return NextResponse.json(
        { error: "Sesi autentikasi tidak ditemukan. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { data: resumes, error } = await supabase
      .from("resumes")
      .select("id, filename, file_url, education, gpa, experience_years, parsed_text, experience_target_role, resume_skills(is_claimed_by_user, needs_review, evidence, skills(name))")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1);

    if (error) throw new Error(error.message);
    if (!resumes || resumes.length === 0) {
      return NextResponse.json({ resume: null });
    }

    const r = resumes[0];
    const details = (r.resume_skills as unknown as Array<{ skills: { name: string }; is_claimed_by_user: boolean; needs_review: boolean; evidence: string | null }> || [])
      .filter((rs) => rs.skills?.name).map((rs) => ({ name: rs.skills.name, claimed: rs.is_claimed_by_user, needsReview: rs.needs_review, evidence: cvEvidence(rs.evidence) }));

    const headers = new Headers();
    headers.set("Cache-Control", "private, no-store, must-revalidate");

    return NextResponse.json(
      {
        resume: {
          id: r.id,
          filename: r.filename,
          fileUrl: r.file_url,
          education: r.education,
          gpa: parseGpaValue(r.gpa),
          experienceYears: r.experience_years,
          summary: r.parsed_text,
          skills: details.map((s) => s.name),
          manualSkills: details.filter((s) => s.claimed).map((s) => s.name),
          skillDetails: details,
          experienceTargetRole: r.experience_target_role,
        },
      },
      { headers }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
