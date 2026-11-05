"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkillBridgeLogo } from "../ui/logo";
import { Button } from "../ui/button";
import { useAuth } from "@/lib/supabase/auth-context";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, logout, loginDemoJuri, loginDemoAdmin } = useAuth();

  const navLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Unggah CV", href: "/cv" },
    { label: "Cari Lowongan", href: "/jobs" },
    { label: "Market Insights", href: "/insights" },
    { label: "Progress", href: "/progress" },
    { label: "Admin", href: "/admin" },
    { label: "Design System", href: "/design-system" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <SkillBridgeLogo size="md" />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / Auth Status */}
        <div className="hidden sm:flex items-center gap-2.5">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <span className="block text-xs font-bold text-slate-900 leading-tight">
                  {user.fullName}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {isAdmin ? (
                    <span className="text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                      Admin
                    </span>
                  ) : (
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Pelamar
                    </span>
                  )}
                </span>
              </div>

              {/* Quick toggle demo role */}
              <button
                type="button"
                onClick={isAdmin ? loginDemoJuri : loginDemoAdmin}
                className="text-[11px] text-blue-600 hover:underline px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200"
                title="Ganti peran demo (Admin <-> Pelamar Juri)"
              >
                Switch ke {isAdmin ? "Juri" : "Admin"}
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut className="w-3.5 h-3.5 text-slate-500" />}
                className="text-xs"
              >
                Keluar
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={loginDemoJuri}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-600" />}
              >
                Demo Juri
              </Button>
              <Link href="/login">
                <Button variant="primary" size="sm" leftIcon={<User className="w-3.5 h-3.5" />}>
                  Masuk
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-2">
          {isAuthenticated && (
            <span className="text-[11px] font-bold text-slate-700 sm:hidden">
              {user?.fullName.split(" ")[0]}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
              >
                Keluar Akun ({user?.fullName})
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  setIsOpen(false);
                  loginDemoJuri();
                }}
              >
                Masuk sebagai Demo Juri
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
