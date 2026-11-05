"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillBridgeLogo } from "@/components/ui/logo";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isLanding = pathname === "/";

  // Tutup menu dan reset scroll saat rute berubah (pola resmi render-time state adjustment)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
    setIsScrolled(false);
  }

  // Sentinel IntersectionObserver 8px untuk deteksi scroll di puncak landing (tanpa scroll listener)
  useEffect(() => {
    if (!isLanding) return;

    const sentinel = document.getElementById("landing-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLanding]);

  const getUserInitials = (name?: string) => {
    if (!name) return "SB";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <>
      <header
        className={cn(
          "w-full z-40 transition-all duration-200 ease-in-out",
          isLanding
            ? cn(
                "fixed top-0 left-0 right-0",
                isOpen
                  ? "bg-white border-b border-sb-border shadow-xs h-16"
                  : isScrolled
                  ? "bg-white/88 backdrop-blur-[20px] backdrop-saturate-[150%] border-b border-sb-border shadow-[0_4px_20px_-4px_rgba(0,90,156,0.10),0_1px_3px_rgba(27,54,93,0.05)] h-16"
                  : "bg-transparent border-b border-transparent shadow-none h-[72px]"
              )
            : "sticky top-0 bg-white border-b border-sb-border shadow-2xs h-16"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          {/* Brand Logo & Left Nav */}
          <div className="flex items-center gap-8">
            <SkillBridgeLogo size="md" />

            {/* Desktop Left Navigation Links */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Navigasi Utama">
              <Link
                href="/lowongan"
                className="py-2 text-sm font-semibold transition-colors text-sb-text-2 hover:text-sb-navy"
              >
                Lowongan
              </Link>
              <Link
                href="/tren-skill"
                className="py-2 text-sm font-semibold transition-colors text-sb-text-2 hover:text-sb-navy"
              >
                Tren Skill
              </Link>
            </nav>
          </div>

          {/* Right CTA / Auth Status */}
          <div className="hidden sm:flex items-center gap-3" suppressHydrationWarning>
            {!isMounted ? (
              <div className="w-32 h-8 bg-sb-mist-soft animate-pulse rounded-full" />
            ) : isAuthenticated && user ? (
              /* Sudah login: satu tombol Buka Dashboard dan avatar kecil */
              <div className="flex items-center gap-2.5">
                <Link href="/dashboard">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs bg-sb-sky text-sb-navy font-bold hover:bg-sb-sky-hover shadow-xs"
                  >
                    Buka Dashboard
                  </Button>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-sb-mist-soft border border-sb-border hover:border-sb-blue transition-colors"
                  title={`${user.fullName} (Profil Saya)`}
                >
                  <span className="text-xs font-bold text-sb-navy">
                    {getUserInitials(user.fullName)}
                  </span>
                </Link>
              </div>
            ) : (
              /* Belum login: Masuk (ghost) dan Mulai gratis */
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-sb-text-2 hover:text-sb-navy font-semibold"
                  >
                    Masuk
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs bg-sb-sky text-sb-navy font-bold hover:bg-sb-sky-hover shadow-xs"
                  >
                    Mulai gratis
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center gap-2">
            {isMounted && isAuthenticated && user && (
              <Link
                href="/dashboard"
                className="w-7 h-7 rounded-full bg-sb-sky text-sb-navy font-bold text-xs flex items-center justify-center"
              >
                {getUserInitials(user.fullName)}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-sb-text-2 hover:text-sb-navy hover:bg-white/70 focus:outline-hidden cursor-pointer"
              aria-label="Navigasi menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu: Sheet putih solid dari kanan */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Solid White Sheet from Right */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between z-50 p-6 border-l border-sb-border animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-sb-border">
                <SkillBridgeLogo size="sm" href="/" />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-sb-text-2 hover:text-sb-navy hover:bg-sb-mist-soft transition-colors cursor-pointer"
                  aria-label="Tutup menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col space-y-2" aria-label="Navigasi Mobile">
                <Link
                  href="/lowongan"
                  onClick={() => setIsOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl text-sm font-semibold text-sb-navy hover:bg-sb-mist-soft transition-colors"
                >
                  Lowongan
                </Link>
                <Link
                  href="/tren-skill"
                  onClick={() => setIsOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl text-sm font-semibold text-sb-navy hover:bg-sb-mist-soft transition-colors"
                >
                  Tren Skill
                </Link>
                {isAuthenticated && (
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="px-3.5 py-2.5 rounded-xl text-sm font-semibold text-sb-navy hover:bg-sb-mist-soft transition-colors"
                  >
                    Profil Saya
                  </Link>
                )}
              </nav>
            </div>

            <div className="pt-6 border-t border-sb-border space-y-2.5">
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center bg-sb-sky text-sb-navy font-bold"
                  >
                    Buka Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button
                      variant="ghost"
                      size="md"
                      className="w-full justify-center text-sb-navy font-semibold"
                    >
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsOpen(false)}>
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full justify-center bg-sb-sky text-sb-navy font-bold shadow-xs"
                    >
                      Mulai gratis
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
