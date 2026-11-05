import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient, getServiceSupabase } from "@/lib/supabase/server";
import { DEMO_USER_NAME, syncDemoUserName } from "@/lib/demo-account";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import { authAttemptRules } from "@/lib/rate-limit-policies";

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
      // Reset = kondisi bersih: tanpa CV, skill, lowongan tersimpan, atau rencana belajar.
      // Hapus resume ikut menghapus resume_skills dan matches (ON DELETE CASCADE).
      const uid = data.user.id;
      await serviceDb.from("resumes").delete().eq("user_id", uid);
      await serviceDb.from("saved_jobs").delete().eq("user_id", uid);
      await serviceDb.from("learning_items").delete().eq("user_id", uid);
      await serviceDb.from("profiles").update({ target_role: "Data Analyst" }).eq("id", uid);

      return NextResponse.json({
        success: true,
        message: "Akun demo berhasil direset ke kondisi awal.",
      });
    }

    // Normal login: hanya menyamakan nama; tidak ada data CV/skill dummy yang dibuat otomatis.
    if (role === "juri") {
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

