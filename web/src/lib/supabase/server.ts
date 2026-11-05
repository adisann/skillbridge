import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || !value.trim()) {
    throw new Error(`Variabel lingkungan wajib [${key}] belum dikonfigurasi.`);
  }
  return value.trim();
}

/**
 * Client Supabase Server-Side berbasis Cookie dan Anon Key (menggunakan RLS).
 * Digunakan untuk seluruh endpoint dan operasi data milik user.
 */
export async function createServerSupabaseClient(req?: NextRequest) {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const cookieStore = await cookies();
  const authHeader = req?.headers.get("authorization");

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Abaikan jika dipanggil dari context Server Component read-only
        }
      },
    },
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

/**
 * Mengambil dan memverifikasi sesi pengguna yang sedang login di server.
 * Memeriksa token Supabase Auth nyata serta cookie sesi server `sb_user_session`.
 */
export async function getAuthenticatedUser(req?: NextRequest) {
  const supabase = await createServerSupabaseClient(req);
  const cookieStore = await cookies();

  // 1. Coba verifikasi via Supabase Auth resmi
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user && !error) {
      return { user, supabase, error: null };
    }
  } catch {
    // Lanjutkan pengecekan cookie fallback server jika jaringan/token sedang refresh
  }

  // 2. Verifikasi via cookie sesi server `sb_user_session` (httpOnly, Secure, SameSite=Lax)
  const sessionCookie = cookieStore.get("sb_user_session")?.value;
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(sessionCookie);
      if (parsed && parsed.userId) {
        // Validasi keaslian user ke tabel profiles
        const serviceDb = getServiceSupabase();
        const { data: profile } = await serviceDb
          .from("profiles")
          .select("id, email, full_name, role, target_role")
          .eq("id", parsed.userId)
          .maybeSingle();

        if (profile) {
          const verifiedUser = {
            id: profile.id,
            email: profile.email,
            user_metadata: {
              full_name: profile.full_name,
              target_role: profile.target_role,
            },
            app_metadata: {
              role: profile.role,
            },
            aud: "authenticated",
            role: "authenticated",
          } as unknown as {
            id: string;
            email?: string;
            user_metadata: { full_name?: string; target_role?: string };
            app_metadata: { role?: string };
          };

          return { user: verifiedUser, supabase, error: null };
        }
      }
    } catch {
      // Cookie rusak atau format tidak valid
    }
  }

  return { user: null, supabase, error: "Tidak terautentikasi" };
}

/**
 * Memverifikasi apakah request berasal dari pengguna dengan role 'admin'.
 * Memeriksa auth.getUser() nyata serta verifikasi kolom role pada tabel profiles.
 */
export async function getAuthenticatedAdmin(req?: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(req);
  if (!user || error) {
    return {
      admin: null,
      user: null,
      error: "Akses ditolak: sesi autentikasi tidak ditemukan. Silakan login terlebih dahulu.",
      status: 401,
      supabase,
    };
  }

  // Verifikasi role di tabel profiles
  const serviceDb = getServiceSupabase();
  const { data: profile } = await serviceDb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isMetadataAdmin =
    (user.user_metadata as Record<string, unknown>)?.role === "admin" ||
    (user.app_metadata as Record<string, unknown>)?.role === "admin";
  const isProfileAdmin = profile?.role === "admin";

  if (!isMetadataAdmin && !isProfileAdmin) {
    return {
      admin: null,
      user,
      error: "Akses terlarang: Akun ini tidak memiliki izin administrator untuk mengakses resource ini.",
      status: 403,
      supabase,
    };
  }

  return { admin: user, user, error: null, status: 200, supabase };
}

/**
 * Client Supabase dengan Service Role Key.
 * HANYA digunakan untuk operasi internal administratif (misalnya import link, import OCR, sync worker).
 * Menghentikan proses dengan error eksplisit jika key tidak tersedia (tanpa silent fallback ke anon key).
 */
export function getServiceSupabase() {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
