"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileUp,
  TrendingUp,
  ClipboardList,
  Briefcase,
  BookOpen,
  UserRound,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Shield,
} from "lucide-react";
import { SkillBridgeLogo } from "../ui/logo";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "CV Saya", href: "/cv", icon: FileUp },
  { label: "Tren Skill", href: "/insights", icon: TrendingUp },
  { label: "Lowongan", href: "/jobs", icon: Briefcase },
  { label: "Lamaran Saya", href: "/tracker", icon: ClipboardList },
  { label: "Rencana Belajar", href: "/progress", icon: BookOpen },
];

export function DashboardSidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoading, isAdmin, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("skillbridge_sidebar_collapsed") === "true";
    }
    return false;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("skillbridge_sidebar_collapsed", String(next));
      return next;
    });
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "SB";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderNavList = (isMobile: boolean = false) => {
    const collapsed = isMobile ? false : isCollapsed;

    return (
      <div className="flex-1 flex flex-col justify-between py-3 overflow-y-auto overflow-x-hidden">
        {/* Navigation links */}
        <div className="space-y-1.5 px-3">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (isMobile && onCloseMobile) onCloseMobile();
                }}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs transition-all relative group",
                  isActive
                    ? "bg-sb-mist-soft text-sb-navy font-bold shadow-2xs border border-sb-border"
                    : "text-sb-text-2 hover:bg-white/70 hover:text-sb-navy font-semibold"
                )}
              >
                {/* Active indicator dot: absolute so icons remain 100% vertically aligned */}
                {isActive && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sb-sky shrink-0" />
                )}

                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-sb-blue" : "text-sb-text-2 group-hover:text-sb-blue"
                  )}
                />

                {!collapsed && (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-3 border-t border-sb-border mx-2" />

          {/* Profil Saya */}
          <Link
            href="/profile"
            onClick={() => {
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
            title={collapsed ? "Profil Saya" : undefined}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs transition-all relative group",
              pathname === "/profile"
                ? "bg-sb-mist-soft text-sb-navy font-bold shadow-2xs border border-sb-border"
                : "text-sb-text-2 hover:bg-white/70 hover:text-sb-navy font-semibold"
            )}
          >
            {pathname === "/profile" && (
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sb-sky shrink-0" />
            )}
            <UserRound
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                pathname === "/profile"
                  ? "text-sb-blue"
                  : "text-sb-text-2 group-hover:text-sb-blue"
              )}
            />
            {!collapsed && <span className="truncate whitespace-nowrap">Profil Saya</span>}
          </Link>

          {/* Optional Admin Link if isAdmin */}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => {
                if (isMobile && onCloseMobile) onCloseMobile();
              }}
              title={collapsed ? "Admin Panel" : undefined}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs transition-all relative group",
                pathname.startsWith("/admin")
                  ? "bg-amber-50 text-amber-800 font-bold shadow-2xs border border-amber-200"
                  : "text-sb-text-2 hover:bg-white/70 hover:text-sb-navy font-semibold"
              )}
            >
              {pathname.startsWith("/admin") && (
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
              )}
              <Shield
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  pathname.startsWith("/admin")
                    ? "text-amber-700"
                    : "text-sb-text-2 group-hover:text-amber-700"
                )}
              />
              {!collapsed && <span className="truncate whitespace-nowrap">Admin Panel</span>}
            </Link>
          )}
        </div>

        {/* User profile & Logout or Login Button at bottom */}
        <div className="pt-3 border-t border-sb-border px-3">
          {isLoading ? (
            <div
              className={cn(
                "flex items-center gap-2.5 p-2 rounded-2xl bg-white/50 animate-pulse",
                collapsed ? "justify-center" : ""
              )}
            >
              <div className="w-8 h-8 rounded-full bg-sb-mist-soft shrink-0" />
              {!collapsed && (
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-3 bg-sb-mist-soft rounded w-20" />
                  <div className="h-2 bg-sb-mist-soft rounded w-28" />
                </div>
              )}
            </div>
          ) : user ? (
            <div
              className={cn(
                "flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/70 border border-sb-border hover:bg-white transition-all shadow-2xs",
                pathname === "/profile" ? "ring-2 ring-sb-blue/30 border-sb-blue bg-sb-mist-soft" : "",
                collapsed ? "justify-center p-1.5 flex-col gap-1.5" : ""
              )}
            >
              <Link
                href="/profile"
                onClick={() => {
                  if (isMobile && onCloseMobile) onCloseMobile();
                }}
                className={cn(
                  "flex items-center gap-2.5 min-w-0 flex-1 group cursor-pointer",
                  collapsed ? "justify-center" : ""
                )}
                title={collapsed ? `${user.fullName} (Profil Saya)` : "Buka Profil Saya"}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sb-sky to-sb-mist text-sb-navy font-bold text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:shadow-sm transition-all">
                  {getUserInitials(user.fullName)}
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-sb-navy truncate group-hover:text-sb-blue transition-colors">
                      {user.fullName}
                    </p>
                    <p className="text-[11px] text-sb-text-2 truncate">
                      {user.email}
                    </p>
                  </div>
                )}
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (isMobile && onCloseMobile) onCloseMobile();
                  logout();
                }}
                title="Keluar"
                aria-label="Keluar sesi"
                className={cn(
                  "p-1.5 rounded-lg text-sb-text-2 hover:text-sb-critical hover:bg-rose-50/80 transition-colors shrink-0 cursor-pointer",
                  collapsed ? "w-8 h-8 flex items-center justify-center" : ""
                )}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => {
                if (isMobile && onCloseMobile) onCloseMobile();
              }}
              title={collapsed ? "Masuk" : undefined}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 rounded-full text-xs font-bold bg-sb-sky text-sb-navy hover:bg-sb-sky-hover transition-all shadow-xs",
                collapsed ? "justify-center px-2" : ""
              )}
            >
              <UserRound className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Coba dengan akun demo</span>}
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ------------------------------------------------------------------- */}
      {/* Desktop Sidebar (Left Sticky)                                       */}
      {/* ------------------------------------------------------------------- */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 z-40 glass-header border-r border-sb-border transition-all duration-250 ease-in-out shrink-0 select-none",
          isCollapsed ? "w-[76px]" : "w-64"
        )}
      >
        {/* Top Header with Logo & Collapse Toggle */}
        <div
          className={cn(
            "h-18 px-4 border-b border-sb-border flex items-center shrink-0",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {isCollapsed ? (
            <SkillBridgeLogo size="sm" showText={false} href="/dashboard" />
          ) : (
            <SkillBridgeLogo size="sm" showText={true} href="/dashboard" />
          )}

          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Buka sidebar" : "Lipat sidebar"}
            className={cn(
              "p-1.5 rounded-xl text-sb-text-2 hover:text-sb-navy hover:bg-white/70 transition-colors cursor-pointer",
              isCollapsed ? "hidden" : "block"
            )}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Floating expand button when collapsed */}
        {isCollapsed && (
          <div className="py-2 flex justify-center border-b border-sb-border">
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label="Buka sidebar"
              className="p-1.5 rounded-xl text-sb-text-2 hover:text-sb-navy hover:bg-white/70 transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Nav List */}
        {renderNavList(false)}
      </aside>

      {/* ------------------------------------------------------------------- */}
      {/* Mobile Drawer (Left Slide-Over Overlay)                             */}
      {/* ------------------------------------------------------------------- */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] glass-panel h-full shadow-2xl flex flex-col z-50 animate-fade-in border-r border-sb-border">
            <div className="h-18 px-5 border-b border-sb-border flex items-center justify-between">
              <SkillBridgeLogo size="sm" href="/dashboard" />
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-xl text-sb-text-2 hover:text-sb-navy hover:bg-white/70 transition-colors cursor-pointer"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderNavList(true)}
          </div>
        </div>
      )}
    </>
  );
}
