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
        <div className="space-y-1 px-3">
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all relative group",
                  isActive
                    ? "bg-blue-50/90 text-blue-700 font-semibold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-blue-600" />
                )}

                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
                  )}
                />

                {!collapsed && (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-3 border-t border-slate-200/80 mx-1" />

          {/* Profil Saya */}
          <Link
            href="/profile"
            onClick={() => {
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
            title={collapsed ? "Profil Saya" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all relative group",
              pathname === "/profile"
                ? "bg-blue-50/90 text-blue-700 font-semibold shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
            )}
          >
            {pathname === "/profile" && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-blue-600" />
            )}
            <UserRound
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                pathname === "/profile"
                  ? "text-blue-600"
                  : "text-slate-400 group-hover:text-slate-700"
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all relative group",
                pathname.startsWith("/admin")
                  ? "bg-amber-50 text-amber-800 font-semibold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
              )}
            >
              {pathname.startsWith("/admin") && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-amber-600" />
              )}
              <Shield
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  pathname.startsWith("/admin")
                    ? "text-amber-600"
                    : "text-slate-400 group-hover:text-slate-700"
                )}
              />
              {!collapsed && <span className="truncate whitespace-nowrap">Admin Panel</span>}
            </Link>
          )}
        </div>

        {/* User profile & Logout or Login Button at bottom */}
        <div className="pt-3 border-t border-slate-200/80 px-3 space-y-2">
          {isLoading ? (
            <div
              className={cn(
                "flex items-center gap-2.5 p-2 rounded-xl bg-slate-100/70 animate-pulse",
                collapsed ? "justify-center" : ""
              )}
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
              {!collapsed && (
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-3 bg-slate-200 rounded w-20" />
                  <div className="h-2 bg-slate-200 rounded w-28" />
                </div>
              )}
            </div>
          ) : user ? (
            <>
              <Link
                href="/profile"
                onClick={() => {
                  if (isMobile && onCloseMobile) onCloseMobile();
                }}
                className={cn(
                  "flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/90 transition-all cursor-pointer group",
                  pathname === "/profile" ? "ring-2 ring-blue-600/30 border-blue-400 bg-blue-50/50" : "",
                  collapsed ? "justify-center" : ""
                )}
                title={collapsed ? `${user.fullName} (Profil Saya)` : "Buka Profil Saya"}
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-blue-700 transition-colors">
                  {getUserInitials(user.fullName)}
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                      {user.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
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
                title={collapsed ? "Keluar" : undefined}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer",
                  collapsed ? "justify-center" : ""
                )}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Keluar</span>}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => {
                if (isMobile && onCloseMobile) onCloseMobile();
              }}
              title={collapsed ? "Masuk" : undefined}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors",
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
      {/* Desktop Sidebar (Left Fixed / Sticky)                                */}
      {/* ------------------------------------------------------------------- */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 z-40 bg-white border-r border-slate-200 transition-all duration-250 ease-in-out shrink-0 select-none",
          isCollapsed ? "w-[72px]" : "w-60"
        )}
      >
        {/* Top Header with Logo & Collapse Toggle */}
        <div
          className={cn(
            "h-16 px-4 border-b border-slate-200/80 flex items-center shrink-0",
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
              "p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer",
              isCollapsed ? "hidden" : "block"
            )}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Floating expand button when collapsed */}
        {isCollapsed && (
          <div className="py-2 flex justify-center border-b border-slate-100">
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label="Buka sidebar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-50 animate-fade-in">
            <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
              <SkillBridgeLogo size="sm" href="/dashboard" />
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
