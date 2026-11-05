import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(req);
    await supabase.auth.signOut();

    const cookieStore = await cookies();
    cookieStore.delete("sb_user_session");

    // Hapus juga cookie sesi lain yang tersimpan
    const allCookies = cookieStore.getAll();
    for (const c of allCookies) {
      if (c.name.startsWith("sb-") || c.name.includes("session")) {
        cookieStore.delete(c.name);
      }
    }

    return NextResponse.json({ success: true }, {
      headers: {
        "Cache-Control": "private, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Gagal keluar sesi." },
      { status: 500 }
    );
  }
}

