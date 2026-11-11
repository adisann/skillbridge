import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Sesi diverifikasi ke Supabase Auth (bukan sekadar ada/tidaknya cookie).
  // Cookie buatan sendiri atau token palsu tidak dianggap login.
  let isAuthenticated = false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });

  const redirect = (url: URL) => {
    const result = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => result.cookies.set(cookie));
    return result;
  };

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    try {
      const { data, error } = await supabase.auth.getUser();
      isAuthenticated = Boolean(data.user) && !error;
    } catch {
      isAuthenticated = false;
    }
  }

  // =========================================================================
  // 1. TAMU (UNAUTHENTICATED):
  //    - /jobs, /jobs/* -> redirect ke /lowongan, /lowongan/*
  //    - /insights, /insights/* -> redirect ke /tren-skill, /tren-skill/*
  //    - Rute aplikasi terproteksi -> redirect ke /login?next=...
  // =========================================================================
  if (!isAuthenticated) {
    if (pathname === "/jobs" || pathname.startsWith("/jobs/")) {
      const publicPath = pathname.replace(/^\/jobs/, "/lowongan");
      const url = new URL(`${publicPath}${search}`, request.url);
      return redirect(url);
    }

    if (pathname === "/insights" || pathname.startsWith("/insights/")) {
      const publicPath = pathname.replace(/^\/insights/, "/tren-skill");
      const url = new URL(`${publicPath}${search}`, request.url);
      return redirect(url);
    }

    // Rute wajib login lainnya
    const protectedPrefixes = [
      "/dashboard",
      "/cv",
      "/tracker",
      "/progress",
      "/profile",
      "/admin",
    ];

    const isProtected = protectedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    if (isProtected) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return redirect(loginUrl);
    }
  }

  // =========================================================================
  // 2. PENGGUNA TERAUTENTIKASI (AUTHENTICATED):
  //    - /lowongan, /lowongan/* -> redirect ke /jobs, /jobs/*
  //    - /tren-skill, /tren-skill/* -> redirect ke /insights, /insights/*
  // =========================================================================
  if (isAuthenticated) {
    if (pathname === "/lowongan" || pathname.startsWith("/lowongan/")) {
      const appPath = pathname.replace(/^\/lowongan/, "/jobs");
      const url = new URL(`${appPath}${search}`, request.url);
      return redirect(url);
    }

    if (pathname === "/tren-skill" || pathname.startsWith("/tren-skill/")) {
      const appPath = pathname.replace(/^\/tren-skill/, "/insights");
      const url = new URL(`${appPath}${search}`, request.url);
      return redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cv/:path*",
    "/tracker/:path*",
    "/progress/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/jobs/:path*",
    "/insights/:path*",
    "/lowongan/:path*",
    "/tren-skill/:path*",
  ],
};
