"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillBridgeLogo } from "@/components/ui/logo";
import { usePathname } from "next/navigation";
import { NAV_LINKS, isNavLinkActive } from "@/components/layout/nav-links";

const MOBILE_LINK_CLASS =
  "px-stack-sm py-stack-xs rounded-xl text-sm font-semibold text-sb-navy hover:bg-sb-mist-soft transition-colors";

interface NavbarMobileMenuProps {
  isAuthenticated: boolean;
  onClose: () => void;
}

/** Menu mobile: sheet putih solid dari kanan. */
export function NavbarMobileMenu({ isAuthenticated, onClose }: NavbarMobileMenuProps) {
  const pathname = usePathname();
  return (
    <div className="fixed inset-0 z-50 md:hidden flex justify-end">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between z-50 p-stack-xl border-l border-sb-border animate-slide-in-right">
        <div className="space-y-stack-xl">
          <div className="flex items-center justify-between pb-stack-md border-b border-sb-border">
            <SkillBridgeLogo size="sm" href="/" />
            <button
              type="button"
              onClick={onClose}
              className="p-stack-2xs rounded-xl text-sb-text-2 hover:text-sb-navy hover:bg-sb-mist-soft transition-colors cursor-pointer"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col space-y-stack-xs" aria-label="Navigasi Mobile">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={onClose} aria-current={isNavLinkActive(pathname, link.href) ? "page" : undefined} className={isNavLinkActive(pathname, link.href) ? `${MOBILE_LINK_CLASS} bg-sb-mist-soft !text-sb-blue` : MOBILE_LINK_CLASS}>
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link href="/profile" onClick={onClose} className={MOBILE_LINK_CLASS}>
                Profil Saya
              </Link>
            )}
          </nav>
        </div>

        <div className="pt-stack-xl border-t border-sb-border space-y-stack-xs">
          {isAuthenticated ? (
            <Link href="/dashboard" onClick={onClose}>
              <Button variant="primary" size="md" className="w-full justify-center bg-sb-sky text-sb-navy font-bold">
                Buka Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" onClick={onClose}>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center bg-sb-sky text-sb-navy font-bold shadow-xs"
                >
                  Masuk
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
