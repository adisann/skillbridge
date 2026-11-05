import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

function getRequiredEnv(key: string): string {
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
 * Hanya sesi Supabase Auth yang diverifikasi server (getUser memvalidasi token ke Auth).
 * Tidak ada cookie buatan sendiri yang dipercaya.
 */
export async function getAuthenticatedUser(req?: NextRequest) {
  const supabase = await createServerSupabaseClient(req);
  // Verifikasi token via Supabase Auth
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user && !error) {
      return { user, supabase, error: null };
    }
  } catch {
    // Jaringan/token bermasalah: dianggap tidak terautentikasi
  }

  return { user: null, supabase, error: "Tidak terautentikasi" };
}

/**
 * Memverifikasi apakah request berasal dari pengguna dengan role 'admin'.
 * Sesi diverifikasi lewat Supabase Auth, role dibaca dari tabel profiles.
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

  // Hanya kolom profiles.role yang dipercaya. user_metadata bisa diubah user sendiri.
  const isProfileAdmin = profile?.role === "admin";

  if (!isProfileAdmin) {
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
