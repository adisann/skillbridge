import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getServiceSupabase } from "@/lib/supabase/server";
import { DEFAULT_TARGET_ROLE, isDemoEmail, resolveLoginEmail, syncDemoUserName } from "@/lib/demo-account";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import { authAttemptRules } from "@/lib/rate-limit-policies";

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimits(authAttemptRules(getClientIp(req)));
    if (limited) return limited;

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const normalizedEmail = resolveLoginEmail(String(email));

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
    if (isDemoEmail(normalizedEmail)) {
      await syncDemoUserName(serviceDb, data.user.id);
    }
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
      targetRole: profileRow?.target_role || DEFAULT_TARGET_ROLE,
      // Penanda akun demo dihitung di server, jadi email akun demo tidak perlu ada di kode frontend
      isDemo: isDemoEmail(data.user.email || normalizedEmail),
    };

    // Sesi dipegang cookie Supabase (httpOnly) yang diset oleh signInWithPassword di atas.

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

