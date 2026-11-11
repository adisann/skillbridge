import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getServiceSupabase } from "@/lib/supabase/server";
import { DEFAULT_TARGET_ROLE, isDemoEmail } from "@/lib/demo-account";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import { authAttemptRules } from "@/lib/rate-limit-policies";

/**
 * Reset akun demo ke kondisi bersih. Tidak ada login lewat endpoint ini:
 * pemanggil harus sudah login (email + kata sandi) sebagai akun demo pelamar.
 */
export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimits(authAttemptRules(getClientIp(req)));
    if (limited) return limited;

    const { user } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
    }
    if (!isDemoEmail(user.email)) {
      return NextResponse.json({ error: "Reset hanya tersedia untuk akun demo." }, { status: 403 });
    }

    const serviceDb = getServiceSupabase();
    const uid = user.id;
    // Reset = kondisi bersih: tanpa CV, skill, lowongan tersimpan, atau rencana belajar.
    // Hapus resume ikut menghapus resume_skills dan matches (ON DELETE CASCADE).
    await serviceDb.from("resumes").delete().eq("user_id", uid);
    await serviceDb.from("saved_jobs").delete().eq("user_id", uid);
    await serviceDb.from("learning_items").delete().eq("user_id", uid);
    await serviceDb.from("profiles").update({ target_role: DEFAULT_TARGET_ROLE }).eq("id", uid);

    return NextResponse.json(
      { success: true, message: "Akun demo berhasil direset ke kondisi awal." },
      { headers: { "Cache-Control": "private, no-store, must-revalidate" } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Gagal mereset akun demo." }, { status: 500 });
  }
}
