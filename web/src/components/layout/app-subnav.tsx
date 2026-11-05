"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Search,
  BarChart3,
  BookmarkCheck,
  BookOpen,
  User,
  Shield,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/supabase/auth-context";

interface SubnavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  badge?: string;
}

const SUBNAV_ITEMS: SubnavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "CV Saya", href: "/cv", icon: FileText },
  { label: "Tren Skill", href: "/insights", icon: BarChart3 },
  { label: "Lowongan", href: "/jobs", icon: Search },
  { label: "Lamaran Saya", href: "/tracker", icon: BookmarkCheck },
  { label: "Rencana Belajar", href: "/progress", icon: BookOpen },
  { label: "Profil Saya", href: "/profile", icon: User },
  { label: "Admin Panel", href: "/admin", icon: Shield, adminOnly: true },
];

export function AppSubnav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  // Hanya tampil di halaman aplikasi (bukan landing page, login, atau register)
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return null;
  }

  const filteredItems = SUBNAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 overflow-x-auto py-2.5 no-scrollbar">
          {/* Left: Tab items */}
          <nav className="flex items-center gap-1.5 shrink-0" aria-label="Navigasi Aplikasi">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 shrink-0 select-none",
                    isActive
                      ? "bg-slate-900 text-white shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-3.5 h-3.5",
                      isActive ? "text-slate-100" : "text-slate-400 group-hover:text-slate-700"
                    )}
                  />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Quick Target Role Pill */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 text-slate-700 font-medium border border-slate-200/60">
              <Target className="w-3 h-3 text-slate-600" />
              Target: <strong className="text-slate-900">{user?.targetRole || "Semua Bidang"}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
