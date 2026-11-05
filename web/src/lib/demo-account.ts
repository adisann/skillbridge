import type { getServiceSupabase } from "@/lib/supabase/server";

const DEMO_USER_NAME = "Budi Pratama";
export const DEMO_USER_EMAIL = "juri@skillbridge.id";

/** Menyamakan nama profil akun demo di database dengan nama bersih (tanpa embel-embel) agar akun lama ikut terbarui. */
export async function syncDemoUserName(serviceDb: ReturnType<typeof getServiceSupabase>, userId: string) {
  await serviceDb
    .from("profiles")
    .update({ full_name: DEMO_USER_NAME })
    .eq("id", userId)
    .neq("full_name", DEMO_USER_NAME);
}
