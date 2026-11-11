"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillBridgeLogo } from "@/components/ui/logo";
import { NAV_LINKS, isNavLinkActive } from "@/components/layout/nav-links";
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
                  ? "bg-white border-b border-sb-border shadow-[0_4px_20px_-4px_rgba(30,64,175,0.10),0_1px_3px_rgba(17,26,46,0.05)] h-16"
                  : "bg-transparent border-b border-transparent shadow-none h-[72px]"
              )
            : "sticky top-0 bg-white border-b border-sb-border shadow-2xs h-16"
        )}
      >
        <div className="max-w-7xl mx-auto px-stack-md sm:px-stack-xl lg:px-stack-2xl h-full flex items-center justify-between gap-stack-md">
          {/* Brand Logo & Left Nav */}
          <div className="flex items-center gap-stack-2xl">
            <SkillBridgeLogo size="md" />

            {/* Desktop Left Navigation Links */}
            <nav className="hidden md:flex items-center gap-stack-xl" aria-label="Navigasi Utama">
              {NAV_LINKS.map((link) => {
                const active = isNavLinkActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative py-stack-xs text-sm font-semibold transition-colors",
                      active
                        ? "text-sb-blue after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-sb-blue"
                        : "text-sb-text-2 hover:text-sb-navy"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right CTA / Auth Status */}
          <div className="hidden sm:flex items-center gap-stack-sm" suppressHydrationWarning>
            {!isMounted ? (
              <div className="w-32 h-8 bg-sb-mist-soft animate-pulse rounded-full" />
            ) : isAuthenticated && user ? (
              /* Sudah login: satu tombol Buka Dashboard dan avatar kecil */
              <div className="flex items-center gap-stack-xs">
                <Link href="/dashboard">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs bg-sb-blue text-white font-bold hover:bg-sb-blue-hover shadow-xs"
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
              /* Belum login: hanya Masuk (pendaftaran publik ditutup) */
              <div className="flex items-center gap-stack-xs">
                <Link href="/login">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs bg-sb-blue text-white font-bold hover:bg-sb-blue-hover shadow-xs"
                  >
                    Masuk
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center gap-stack-xs">
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
              className="p-stack-xs rounded-xl text-sb-text-2 hover:text-sb-navy hover:bg-sb-mist-faint focus:outline-hidden cursor-pointer"
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
