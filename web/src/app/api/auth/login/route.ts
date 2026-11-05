import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient, getServiceSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const normalizedEmail =
      cleanEmail === "juri@skillbridge.demo"
        ? "juri@skillbridge.id"
        : cleanEmail === "admin@skillbridge.demo"
        ? "admin@skillbridge.id"
        : cleanEmail;

    const supabase = await createServerSupabaseClient(req);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: String(password),
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || "Email atau kata sandi tidak valid." },
        { status: 401 }
      );
    }

    // Ambil profile dari database
    const serviceDb = getServiceSupabase();
    const { data: profileRow } = await serviceDb
      .from("profiles")
      .select("id, email, full_name, role, target_role")
      .eq("id", data.user.id)
      .maybeSingle();

    const userProfile = {
      id: data.user.id,
      email: data.user.email || normalizedEmail,
      fullName:
        profileRow?.full_name ||
        data.user.user_metadata?.full_name ||
        normalizedEmail.split("@")[0],
      role: (profileRow?.role as "user" | "admin") || "user",
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
        maxAge: 60 * 60 * 24 * 7, // 7 hari
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
      { error: error.message || "Gagal memproses autentikasi." },
      { status: 500 }
    );
  }
}

