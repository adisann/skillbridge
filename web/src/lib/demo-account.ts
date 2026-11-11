import type { getServiceSupabase } from "@/lib/supabase/server";

/** Akun demo dan nama tampilannya dapat diatur lewat env; nilai bawaan menjaga deployment lama tetap berjalan. */
const DEMO_USER_NAME = process.env.DEMO_USER_NAME?.trim() || "Budi Pratama";
const DEMO_USER_EMAIL = (process.env.DEMO_USER_EMAIL?.trim() || "juri@skillbridge.id").toLowerCase();

/** Target karier awal untuk profil baru dan akun demo yang direset. */
export const DEFAULT_TARGET_ROLE = "Data Analyst";

/** Alamat seed lama (*.demo) tetap bisa dipakai masuk ke akun yang sudah dipindahkan ke domain .id. */
const LEGACY_LOGIN_ALIASES: Record<string, string> = {
  "juri@skillbridge.demo": "juri@skillbridge.id",
  "admin@skillbridge.demo": "admin@skillbridge.id",
};

export function resolveLoginEmail(email: string): string {
  const clean = email.trim().toLowerCase();
  return LEGACY_LOGIN_ALIASES[clean] || clean;
}

export function isDemoEmail(email?: string | null): boolean {
  return (email || "").trim().toLowerCase() === DEMO_USER_EMAIL;
}

/** Menyamakan nama profil akun demo di database dengan nama bersih (tanpa embel-embel) agar akun lama ikut terbarui. */
export async function syncDemoUserName(serviceDb: ReturnType<typeof getServiceSupabase>, userId: string) {
  await serviceDb
    .from("profiles")
    .update({ full_name: DEMO_USER_NAME })
    .eq("id", userId)
    .neq("full_name", DEMO_USER_NAME);
}
