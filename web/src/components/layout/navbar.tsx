"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillBridgeLogo } from "@/components/ui/logo";
import { NAV_LINKS } from "@/components/layout/nav-links";
import { NavbarMobileMenu } from "@/components/layout/navbar-mobile-menu";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("pageshow", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("pageshow", onChange);
  };
}

function hasScrolled() {
  return window.scrollY > 0;
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const isScrolled = useSyncExternalStore(subscribeToScroll, hasScrolled, () => false);
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isLanding = pathname === "/";

  // Tutup menu saat rute berubah; posisi scroll mengikuti browser.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

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
          "w-full z-40 transition-[background-color,border-color,box-shadow,height] duration-200 ease-out-strong",
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
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-2 text-sm font-semibold transition-colors text-sb-text-2 hover:text-sb-navy"
                >
                  {link.label}
                </Link>
              ))}
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

      {isOpen && <NavbarMobileMenu isAuthenticated={isAuthenticated} onClose={() => setIsOpen(false)} />}
    </>
  );
}
