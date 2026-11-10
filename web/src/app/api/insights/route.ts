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
    const reviewCvSkills: string[] = [];

    if (user) {
      const { data: userResumes } = await supabase
        .from("resumes")
        .select("id, resume_skills(is_claimed_by_user, needs_review, skills(name))")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1);

      if (userResumes && userResumes.length > 0) {
        for (const rs of (userResumes[0].resume_skills as unknown as Array<{ is_claimed_by_user: boolean; needs_review: boolean; skills: { name: string } }>) || []) {
          const sName = rs.skills?.name;
          if (sName) {
            if (rs.is_claimed_by_user) {
              claimedCvSkills.push(sName);
            } else if (rs.needs_review) {
              reviewCvSkills.push(sName);
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
      { verified: verifiedCvSkills, claimed: claimedCvSkills, review: reviewCvSkills }
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
        // Halaman Tren Skill menampilkan 15 dulu lalu "Tampilkan lebih banyak"
        topSkills: aggregation.topSkills.slice(0, 60),
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

    if (typeof skillName !== "string" || !skillName.trim() || skillName.length > 200) {
      return NextResponse.json({ error: "Nama skill wajib diisi" }, { status: 400 });
    }

    const { error } = await supabase.rpc("claim_resume_skill", { p_skill_name: skillName });
    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: `Skill '${skillName}' dicatat sebagai pengakuan mandiri (ditambahkan oleh pengguna).`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal menandai skill: " + (err.message || "Kesalahan server") },
      { status: 500 }
    );
  }
}
