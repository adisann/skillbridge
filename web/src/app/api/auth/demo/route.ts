import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient, getServiceSupabase } from "@/lib/supabase/server";
import { DEMO_USER_NAME, syncDemoUserName } from "@/lib/demo-account";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import { authAttemptRules } from "@/lib/rate-limit-policies";

const DEMO_SKILLS = [
  { name: "SQL", evidence: "Query database transaksi PostgreSQL di CV" },
  { name: "PostgreSQL", evidence: "PostgreSQL database administration" },
  { name: "Python", evidence: "Automasi script Python di CV" },
  { name: "Pandas", evidence: "Manipulasi dataset Pandas" },
  { name: "Microsoft Excel", evidence: "Microsoft Excel Pivot & VLOOKUP" },
  { name: "Visualisasi Data", evidence: "Portofolio visualisasi data performa produk" },
  { name: "Statistika", evidence: "Latar belakang S1 Matematika & Statistika" },
];

async function ensureDemoResume(
  serviceDb: ReturnType<typeof getServiceSupabase>,
  userId: string,
  forceReset = false
) {
  try {
    // 1. Cek resume aktif milik user demo
    const { data: existingResumes } = await serviceDb
      .from("resumes")
      .select("id, resume_skills(id, skill_id)")
      .eq("user_id", userId)
      .eq("is_active", true);

    const existingResume = existingResumes && existingResumes.length > 0 ? existingResumes[0] : null;
    const existingSkillCount = existingResume?.resume_skills?.length || 0;

    let resumeId = existingResume?.id;

    if (!resumeId) {
      const { data: newResume, error: insertErr } = await serviceDb
        .from("resumes")
        .insert({
          user_id: userId,
          filename: "CV_Budi_Pratama_DataAnalyst.pdf",
          file_url: "https://r2.skillbridge.id/resumes/demo/budi_pratama.pdf",
          parsed_text:
            "Lulusan S1 Matematika dengan 2 tahun pengalaman analisis data transaksi di perbankan digital. Mahir SQL PostgreSQL, Python Pandas, Microsoft Excel, dan visualisasi data.",
          education: "S1 Matematika & Statistika",
          experience_years: 2,
          is_active: true,
        })
        .select("id")
        .single();

      if (insertErr || !newResume) {
        console.error("Gagal insert demo resume:", insertErr);
        return;
      }
      resumeId = newResume.id;
    } else if (forceReset) {
      await serviceDb
        .from("resumes")
        .update({
          filename: "CV_Budi_Pratama_DataAnalyst.pdf",
          file_url: "https://r2.skillbridge.id/resumes/demo/budi_pratama.pdf",
          parsed_text:
            "Lulusan S1 Matematika dengan 2 tahun pengalaman analisis data transaksi di perbankan digital. Mahir SQL PostgreSQL, Python Pandas, Microsoft Excel, dan visualisasi data.",
          education: "S1 Matematika & Statistika",
          experience_years: 2,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resumeId);
    }

    // 2. Jika forceReset atau skill kosong, tautkan kembali 7 demo skills
    if (forceReset || existingSkillCount === 0) {
      if (forceReset) {
        await serviceDb.from("resume_skills").delete().eq("resume_id", resumeId);
      }

      for (const item of DEMO_SKILLS) {
        let skillId: string | null = null;
        const { data: foundSkill } = await serviceDb
          .from("skills")
          .select("id")
          .ilike("name", item.name.trim())
          .limit(1);

        if (foundSkill && foundSkill.length > 0) {
          skillId = foundSkill[0].id;
        } else {
          const { data: createdSkill } = await serviceDb
            .from("skills")
            .insert({ name: item.name.trim(), category: "Data & Analitik" })
            .select("id")
            .single();
          if (createdSkill) skillId = createdSkill.id;
        }

        if (skillId) {
          await serviceDb.from("resume_skills").upsert(
            {
              resume_id: resumeId,
              skill_id: skillId,
              is_claimed_by_user: false,
              evidence: item.evidence,
            },
            { onConflict: "resume_id,skill_id" }
          );
        }
      }
    }
  } catch (err) {
    console.error("Error saat ensureDemoResume:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const isDemoEnabled =
      process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
      process.env.NODE_ENV !== "production";

    if (!isDemoEnabled) {
      return NextResponse.json(
        { error: "Fitur demo dinonaktifkan di lingkungan produksi." },
        { status: 403 }
      );
    }

    const limited = await enforceRateLimits(authAttemptRules(getClientIp(req)));
    if (limited) return limited;

    let role = "juri";
    let action = "login";
    try {
      const body = await req.json();
      if (body?.role === "admin") role = "admin";
      if (body?.action) action = body.action;
    } catch {
      // default juri
    }

    const demoEmail = role === "admin" ? "admin@skillbridge.id" : "juri@skillbridge.id";
    const demoPassword = role === "admin" ? "AdminSkillBridge2026!" : "DemoJuriInvofest2026!";

    const supabase = await createServerSupabaseClient(req);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || "Akun demo tidak dapat diakses." },
        { status: 401 }
      );
    }

    const serviceDb = getServiceSupabase();

    // Khusus aksi "reset"
    if (action === "reset") {
      await serviceDb.from("saved_jobs").delete().eq("user_id", data.user.id);
      await serviceDb.from("learning_items").delete().eq("user_id", data.user.id);
      await serviceDb.from("profiles").update({ target_role: "Data Analyst" }).eq("id", data.user.id);
      await ensureDemoResume(serviceDb, data.user.id, true);

      return NextResponse.json({
        success: true,
        message: "Akun demo berhasil direset ke kondisi awal.",
      });
    }

    // Normal login: pastikan resume & skills selalu tersedia idempoten untuk akun demo
    if (role === "juri") {
      await ensureDemoResume(serviceDb, data.user.id, false);
      await syncDemoUserName(serviceDb, data.user.id);
    }

    const { data: profileRow } = await serviceDb
      .from("profiles")
      .select("id, email, full_name, role, target_role")
      .eq("id", data.user.id)
      .maybeSingle();

    const userProfile = {
      id: data.user.id,
      email: data.user.email || (role === "admin" ? "admin@skillbridge.demo" : "juri@skillbridge.demo"),
      fullName: profileRow?.full_name || (role === "admin" ? "Administrator SkillBridge" : DEMO_USER_NAME),
      role: (profileRow?.role as "user" | "admin") || (role === "admin" ? "admin" : "user"),
      targetRole: (profileRow?.target_role as "Data Analyst" | "BI Analyst") || "Data Analyst",
    };

    // Tetapkan cookie httpOnly, Secure, SameSite=Lax di server
    const cookieStore = await cookies();
    cookieStore.set(
      "sb_user_session",
      JSON.stringify({
        userId: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.fullName,
        role: userProfile.role,
        targetRole: userProfile.targetRole,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    return NextResponse.json({
      success: true,
      user: userProfile,
    }, {
      headers: {
        "Cache-Control": "private, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Gagal masuk ke akun demo." },
      { status: 500 }
    );
  }
}

