import { DEMO_USER_EMAIL } from "@/lib/demo-account";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getServiceSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(req);

    if (!user || error) {
      return NextResponse.json(
        { user: null },
        {
          headers: {
            "Cache-Control": "private, no-store, must-revalidate",
          },
        }
      );
    }

    const serviceDb = getServiceSupabase();
    const { data: profileRow } = await serviceDb
      .from("profiles")
      .select("id, email, full_name, role, target_role")
      .eq("id", user.id)
      .maybeSingle();

    const profile = {
      id: user.id,
      email: user.email || profileRow?.email || "",
      fullName:
        profileRow?.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Pengguna",
      role: (profileRow?.role as "user" | "admin") || (user.app_metadata?.role === "admin" ? "admin" : "user"),
      targetRole: (profileRow?.target_role as "Data Analyst" | "BI Analyst") || "Data Analyst",
      isDemo: (user.email || "").toLowerCase() === DEMO_USER_EMAIL,
    };

    return NextResponse.json(
      { user: profile },
      {
        headers: {
          "Cache-Control": "private, no-store, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { user: null },
      {
        headers: {
          "Cache-Control": "private, no-store, must-revalidate",
        },
      }
    );
  }
}

