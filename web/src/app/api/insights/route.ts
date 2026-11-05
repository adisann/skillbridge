import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getCachedPublicJobs, aggregateMarketData } from "@/lib/public-jobs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("bidang") || searchParams.get("role");
    const role = roleParam && roleParam !== "all" ? roleParam : "all";
    const workType = searchParams.get("workType");
    const seniority = searchParams.get("seniority");
    const location = searchParams.get("location");
    const postedDate = searchParams.get("postedDate");

    const { user, supabase } = await getAuthenticatedUser(req);

    // 1. Ambil katalog lowongan publik aktif dari cache server (unstable_cache tag 'jobs')
    const allJobs = await getCachedPublicJobs();

    // 2. Ambil skill CV aktif pengguna jika terautentikasi (AC-04)
    const verifiedCvSkills: string[] = [];
    const claimedCvSkills: string[] = [];

    if (user) {
      const { data: userResumes } = await supabase
        .from("resumes")
        .select("id, resume_skills(is_claimed_by_user, skills(name))")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1);

      if (userResumes && userResumes.length > 0) {
        for (const rs of (userResumes[0].resume_skills as unknown as Array<{ is_claimed_by_user: boolean; skills: { name: string } }>) || []) {
          const sName = rs.skills?.name;
          if (sName) {
            if (rs.is_claimed_by_user) {
              claimedCvSkills.push(sName);
            } else {
              verifiedCvSkills.push(sName);
            }
          }
        }
      }
    }

    // 3. Gunakan agregasi pasar kanonikal tunggal
    const aggregation = aggregateMarketData(
      allJobs,
      { role, workType, seniority, location, postedDate },
      { verified: verifiedCvSkills, claimed: claimedCvSkills }
    );

    const headers = new Headers();
    headers.set("Vary", "Cookie");
    if (user) {
      headers.set("Cache-Control", "private, no-store, must-revalidate");
    } else {
      headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    }

    return NextResponse.json(
      {
        role,
        sampleSizeN: aggregation.sampleSizeN,
        lastUpdated: aggregation.lastUpdatedDate,
        topSkills: aggregation.topSkills.slice(0, 15),
        learningRecommendations: aggregation.learningRecommendations,
      },
      { headers }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Gagal memuat insights" }, { status: 500 });
  }
}

/**
 * Klaim skill mandiri oleh pengguna (AGENTS.md: "Pengguna bisa menandai skill yang dikuasai tetapi belum tertulis. Jangan menyebutnya terverifikasi.")
 */
export async function POST(req: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedUser(req);
    if (!user || authError) {
      return NextResponse.json(
        { error: "Sesi autentikasi tidak ditemukan. Silakan login terlebih dahulu untuk menandai skill." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { skillName } = body;

    if (!skillName) {
      return NextResponse.json({ error: "Nama skill wajib diisi" }, { status: 400 });
    }

    const effectiveUserId = user.id;

    // 1. Dapatkan resume aktif
    const { data: resume } = await supabase
      .from("resumes")
      .select("id")
      .eq("user_id", effectiveUserId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!resume) {
      return NextResponse.json({ error: "Resume aktif belum ditemukan. Unggah CV terlebih dahulu." }, { status: 404 });
    }

    // 2. Dapatkan atau buat skill
    let skillId: string | null = null;
    const { data: foundSkill } = await supabase
      .from("skills")
      .select("id")
      .ilike("name", skillName.trim())
      .limit(1);

    if (foundSkill && foundSkill.length > 0) {
      skillId = foundSkill[0].id;
    } else {
      const { data: newSkill } = await supabase
        .from("skills")
        .insert({ name: skillName.trim(), category: "Data & Analytics" })
        .select("id")
        .single();
      if (newSkill) skillId = newSkill.id;
    }

    if (!skillId) throw new Error("Gagal mengidentifikasi skill");

    // 3. Upsert ke resume_skills dengan is_claimed_by_user = true
    await supabase.from("resume_skills").upsert({
      resume_id: resume.id,
      skill_id: skillId,
      is_claimed_by_user: true,
      evidence: "Ditandai manual oleh pengguna (belum ditemukan di dokumen CV).",
    }, { onConflict: "resume_id,skill_id" });

    return NextResponse.json({
      success: true,
      message: `Skill '${skillName}' berhasil ditandai sebagai dikuasai (status: Perlu verifikasi).`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal menandai skill: " + (err.message || "Kesalahan server") },
      { status: 500 }
    );
  }
}
