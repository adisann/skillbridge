import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Cek cookie sesi server
  let isAuthenticated = false;

  const sessionCookie = request.cookies.get("sb_user_session")?.value;
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(sessionCookie);
      if (parsed && parsed.userId) {
        isAuthenticated = true;
      }
    } catch {
      // cookie tidak valid
    }
  }

  // Cek juga cookie Supabase auth token jika sb_user_session tidak ada
  if (!isAuthenticated) {
    const allCookies = request.cookies.getAll();
    const hasSupabaseCookie = allCookies.some(
      (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
    );
    if (hasSupabaseCookie) {
      isAuthenticated = true;
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
      return NextResponse.redirect(url);
    }

    if (pathname === "/insights" || pathname.startsWith("/insights/")) {
      const publicPath = pathname.replace(/^\/insights/, "/tren-skill");
      const url = new URL(`${publicPath}${search}`, request.url);
      return NextResponse.redirect(url);
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
      return NextResponse.redirect(loginUrl);
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
      return NextResponse.redirect(url);
    }

    if (pathname === "/tren-skill" || pathname.startsWith("/tren-skill/")) {
      const appPath = pathname.replace(/^\/tren-skill/, "/insights");
      const url = new URL(`${appPath}${search}`, request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
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
