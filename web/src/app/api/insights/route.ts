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
    const role = searchParams.get("role") || "Data Analyst";
    const workType = searchParams.get("workType");
    const seniority = searchParams.get("seniority");
    const userId = searchParams.get("userId") || "00000000-0000-0000-0000-000000000001";

    const supabase = getServiceSupabase();

    // 1. Ambil seluruh lowongan aktif sesuai filter
    let jobsQuery = supabase
      .from("jobs")
      .select("id, canonical_title, location, employment_type, seniority")
      .eq("is_active", true);

    if (role && role !== "all") {
      jobsQuery = jobsQuery.ilike("canonical_title", `%${role}%`);
    }

    const { data: allMatchedJobs, error: jobsErr } = await jobsQuery;
    if (jobsErr) throw new Error(jobsErr.message);

    let filteredJobs = allMatchedJobs || [];

    if (workType && workType !== "all") {
      const target = workType.toLowerCase();
      filteredJobs = filteredJobs.filter((j: Record<string, unknown>) => {
        const loc = ((j.location as string) || "").toLowerCase();
        const emp = ((j.employment_type as string) || "").toLowerCase();
        if (target === "remote") return loc.includes("remote") || emp.includes("remote");
        if (target === "hybrid") return loc.includes("hybrid") || emp.includes("hybrid");
        if (target === "onsite") return !loc.includes("remote") && !emp.includes("remote");
        return true;
      });
    }

    if (seniority && seniority !== "all") {
      const targetSen = seniority.toLowerCase();
      filteredJobs = filteredJobs.filter((j: Record<string, unknown>) =>
        ((j.seniority as string) || "").toLowerCase().includes(targetSen)
      );
    }

    const sampleSizeN = Math.max(filteredJobs.length, 1);
    const jobIds = filteredJobs.map((j: { id: string }) => j.id);

    // 2. Agregasi job_skills per posting lowongan unik (AC-03: n dihitung satu kali per posting)
    const skillCounts: Record<string, { count: number; category: string; snippet: string }> = {};

    if (jobIds.length > 0) {
      const { data: jobSkillsData } = await supabase
        .from("job_skills")
        .select("job_id, is_mandatory, requirement_snippet, skills(name, category)")
        .in("job_id", jobIds);

      const seenPair = new Set<string>();

      for (const item of (jobSkillsData as unknown as Array<{ job_id: string; requirement_snippet: string; skills: { name: string; category: string } }>) || []) {
        const sName = item.skills?.name;
        if (!sName) continue;

        const pairKey = `${item.job_id}:${sName.toLowerCase()}`;
        if (seenPair.has(pairKey)) continue;
        seenPair.add(pairKey);

        if (!skillCounts[sName]) {
          skillCounts[sName] = {
            count: 0,
            category: item.skills?.category || "Data Analysis",
            snippet: item.requirement_snippet || `Persyaratan kualifikasi ${sName}`,
          };
        }
        skillCounts[sName].count++;
      }
    }

    // 3. Ambil skill CV aktif pengguna untuk penandaan checklist & verifikasi (AC-04)
    const { data: userResumes } = await supabase
      .from("resumes")
      .select("id, resume_skills(is_claimed_by_user, evidence, skills(name))")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1);

    const verifiedCvSkills = new Set<string>();
    const claimedCvSkills = new Set<string>();

    if (userResumes && userResumes.length > 0) {
      for (const rs of (userResumes[0].resume_skills as unknown as Array<{ is_claimed_by_user: boolean; evidence: string; skills: { name: string } }>) || []) {
        const sName = rs.skills?.name?.toLowerCase();
        if (sName) {
          if (rs.is_claimed_by_user && rs.evidence?.includes("manual")) {
            claimedCvSkills.add(sName);
          } else {
            verifiedCvSkills.add(sName);
          }
        }
      }
    }

    // 4. Susun daftar top skills dengan perankingan
    const rankedSkills = Object.entries(skillCounts)
      .map(([name, info]) => {
        const n = info.count;
        const percentage = Math.min(100, Math.round((n / sampleSizeN) * 100));

        let cvStatus: "tercantum" | "belum_ditemukan" | "perlu_verifikasi" = "belum_ditemukan";
        let statusLabel = "Belum ditemukan di CV";

        if (verifiedCvSkills.has(name.toLowerCase())) {
          cvStatus = "tercantum";
          statusLabel = "Tercantum di CV";
        } else if (claimedCvSkills.has(name.toLowerCase())) {
          cvStatus = "perlu_verifikasi";
          statusLabel = "Perlu verifikasi (klaim mandiri)";
        }

        return {
          skillName: name,
          category: info.category,
          frequencyCount: n,
          percentage,
          cvStatus,
          statusLabel,
          exampleRequirement: info.snippet,
        };
      })
      .sort((a, b) => b.frequencyCount - a.frequencyCount);

    // Format tanggal Indonesia
    const now = new Date();
    const dateFormatted = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now);

    return NextResponse.json({
      role,
      sampleSizeN,
      lastUpdated: dateFormatted,
      topSkills: rankedSkills.slice(0, 15),
      learningRecommendations: rankedSkills
        .filter((s) => s.cvStatus === "belum_ditemukan")
        .slice(0, 3)
        .map((s, idx) => ({
          skillName: s.skillName,
          demandPercentage: s.percentage,
          reason: `Diminta oleh ${s.percentage}% sampel lowongan ${role === "all" ? "pasar" : role}. Menjadi target prioritas tinggi karena belum ditemukan di CV Anda.`,
          priority: idx === 0 ? "Tinggi" : "Menengah",
          action: "Tambahkan ke Rencana Belajar",
        })),
    });
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
    const body = await req.json();
    const { userId, skillName } = body;

    if (!skillName) {
      return NextResponse.json({ error: "Nama skill wajib diisi" }, { status: 400 });
    }

    const effectiveUserId = userId || "00000000-0000-0000-0000-000000000001";
    const supabase = getServiceSupabase();

    // 1. Dapatkan resume aktif
    const { data: resume } = await supabase
      .from("resumes")
      .select("id")
      .eq("user_id", effectiveUserId)
      .eq("is_active", true)
      .limit(1)
      .single();

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
      evidence: "Ditandai manual oleh pengguna (belum terverifikasi di dokumen CV).",
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
