import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient, getServiceSupabase } from "@/lib/supabase/server";

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

    let role = "juri";
    try {
      const body = await req.json();
      if (body?.role === "admin") role = "admin";
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
    const { data: profileRow } = await serviceDb
      .from("profiles")
      .select("id, email, full_name, role, target_role")
      .eq("id", data.user.id)
      .maybeSingle();

    const userProfile = {
      id: data.user.id,
      email: data.user.email || (role === "admin" ? "admin@skillbridge.demo" : "juri@skillbridge.demo"),
      fullName: profileRow?.full_name || (role === "admin" ? "Administrator SkillBridge" : "Budi Pratama (Juri Lomba)"),
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

