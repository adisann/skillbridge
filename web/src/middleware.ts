import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // Daftar rute yang wajib memiliki sesi terautentikasi
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

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
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
  ],
};

