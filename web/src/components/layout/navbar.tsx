"use client";

import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  FileText,
  BarChart3,
  BookmarkCheck,
  Search,
  BookOpen,
  User,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SkillBridgeLogo } from "../ui/logo";
import { Button } from "../ui/button";
import { useAuth } from "@/lib/supabase/auth-context";

const emptySubscribe = () => () => {};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/register";

  const dashboardMenuItems = [
    {
      title: "CV Saya",
      description: "Unggah dan koreksi kualifikasi berkas CV-mu",
      href: "/cv",
      icon: FileText,
    },
    {
      title: "Tren Skill",
      description: "Pantau tren keahlian yang paling dicari industri",
      href: "/insights",
      icon: BarChart3,
    },
    {
      title: "Lamaran Saya",
      description: "Kelola tahapan lamaran dan prioritas lowongan",
      href: "/tracker",
      icon: BookmarkCheck,
    },
    {
      title: "Lowongan",
      description: "Eksplorasi lowongan kerja terverifikasi sesuai profil",
      href: "/jobs",
      icon: Search,
    },
    {
      title: "Rencana Belajar",
      description: "Target peningkatan keahlian dan lowongan tersimpan",
      href: "/progress",
      icon: BookOpen,
    },
    {
      title: "Profil Saya",
      description: "Kelola data akun, preferensi peran kerja, dan CV aktif",
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <SkillBridgeLogo size="md" />

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi Utama">
            {isPublicPage && !isAuthenticated ? (
              /* Public / Landing Page Navigation */
              <>
                <Link
                  href="/#fitur"
                  className="px-3.5 py-2 rounded-full text-xs font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-colors"
                >
                  Fitur
                </Link>
                <Link
                  href="/#cara-kerja"
                  className="px-3.5 py-2 rounded-full text-xs font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-colors"
                >
                  Cara Kerja
                </Link>
              </>
            ) : (
              /* Authenticated Navigation with Mega-Menu Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 select-none",
                    pathname.startsWith("/dashboard") || isDropdownOpen
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                  )}
                  aria-expanded={isDropdownOpen}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform duration-150",
                      isDropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Mega-menu dropdown (Together.ai pattern) */}
                {isDropdownOpen && (
                  <div
                    onMouseLeave={() => setIsDropdownOpen(false)}
                    className="absolute left-0 top-full pt-2 z-50 w-80 sm:w-96 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl space-y-1">
                      <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Menu Aplikasi
                        </span>
                        <Link
                          href="/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Buka Ringkasan <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      {dashboardMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsDropdownOpen(false)}
                            className={cn(
                              "flex items-start gap-3 p-2.5 rounded-xl transition-colors group",
                              isActive
                                ? "bg-slate-50 text-slate-900 font-semibold"
                                : "hover:bg-slate-50 text-slate-700"
                            )}
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-700 flex items-center justify-center shrink-0 transition-colors mt-0.5">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-slate-500 leading-tight pt-0.5">
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Right CTA / Auth Status */}
        <div className="hidden sm:flex items-center gap-2.5" suppressHydrationWarning>
          {!isMounted ? (
            <div className="w-32 h-8 bg-slate-100 animate-pulse rounded-full" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <Link href="/dashboard">
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-full shadow-xs text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Buka Dashboard
                </Button>
              </Link>

              {/* User Identity */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80">
                <span className="block text-xs font-semibold text-slate-800 leading-tight">
                  {user.fullName}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                  {isAdmin ? "Admin" : "Pelamar"}
                </span>
              </div>

              {/* Admin Link if user has Admin role */}
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 transition-colors"
                >
                  Admin Panel
                </Link>
              ) : null}

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut className="w-3.5 h-3.5 text-slate-500" />}
                className="text-xs text-slate-600 hover:text-slate-900 rounded-full"
              >
                Keluar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs font-medium border-slate-300 hover:bg-slate-50 text-slate-700"
                >
                  Masuk
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-full shadow-xs text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Mulai Gratis
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {isMounted && isAuthenticated && user && (
            <span className="text-xs font-semibold text-slate-700">
              {user.fullName.split(" ")[0]}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
            aria-label="Navigasi menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Ringkasan Dashboard</span>
              </Link>
              {dashboardMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
              <div className="pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center rounded-lg"
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                >
                  Keluar ({user?.fullName})
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/#fitur"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Fitur
              </Link>
              <Link
                href="/#cara-kerja"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cara Kerja
              </Link>
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full justify-center rounded-lg">
                    Masuk
                  </Button>
                </Link>
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full justify-center rounded-lg">
                    Mulai Gratis
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
