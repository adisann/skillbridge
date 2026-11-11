"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  History,
  Layers,
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

const SIDEBAR_STORAGE_KEY = "skillbridge_sidebar_collapsed";
const SIDEBAR_CHANGE_EVENT = "skillbridge-sidebar-change";

function subscribeToSidebar(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, onChange);
  };
}

function getSidebarCollapsed() {
  return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

export function DashboardSidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { user, isLoading, isAdmin, logout } = useAuth();
  const isCollapsed = useSyncExternalStore(subscribeToSidebar, getSidebarCollapsed, () => false);

  const toggleCollapse = () => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(!isCollapsed));
    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
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
      <div className="flex-1 flex flex-col justify-between py-stack-sm overflow-y-auto overflow-x-hidden">
        {/* Navigation links */}
        <div className="space-y-stack-2xs px-stack-sm">
          {(isAdmin ? [
            { label: "Lowongan", href: "/admin?tab=jobs", icon: Briefcase },
            { label: "Skill & Sumber", href: "/admin?tab=skills", icon: Layers },
            { label: "Riwayat", href: "/admin?tab=runs", icon: History },
          ] : PRIMARY_NAV_ITEMS).map((item) => {
            const Icon = item.icon;
            const isActive =
              (isAdmin && pathname === "/admin" ? item.href === `/admin?tab=${params.get("tab") || "jobs"}` : pathname === item.href) ||
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
                  "flex items-center gap-stack-sm px-stack-sm py-stack-xs rounded-full text-xs transition-ui relative group",
                  isActive
                    ? "bg-sb-mist-soft text-sb-navy font-bold shadow-2xs border border-sb-border"
                    : "text-sb-text-2 hover:bg-sb-mist-faint hover:text-sb-navy font-semibold"
                )}
              >
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
          <div className="my-stack-sm border-t border-sb-border mx-stack-xs" />

          {/* Profil Saya */}
          <Link
            href="/profile"
            onClick={() => {
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
            title={collapsed ? "Profil Saya" : undefined}
            className={cn(
              "flex items-center gap-stack-sm px-stack-sm py-stack-xs rounded-full text-xs transition-ui relative group",
              pathname === "/profile"
                ? "bg-sb-mist-soft text-sb-navy font-bold shadow-2xs border border-sb-border"
                : "text-sb-text-2 hover:bg-sb-mist-faint hover:text-sb-navy font-semibold"
            )}
          >
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


        </div>

        {/* User profile & Logout or Login Button at bottom */}
        <div className="pt-stack-sm border-t border-sb-border px-stack-sm">
          {isLoading ? (
            <div
              className={cn(
                "flex items-center gap-stack-xs p-stack-xs rounded-2xl bg-sb-mist-faint animate-pulse",
                collapsed ? "justify-center" : ""
              )}
            >
              <div className="w-8 h-8 rounded-full bg-sb-mist-soft shrink-0" />
              {!collapsed && (
                <div className="flex-1 space-y-stack-2xs min-w-0">
                  <div className="h-3 bg-sb-mist-soft rounded w-20" />
                  <div className="h-2 bg-sb-mist-soft rounded w-28" />
                </div>
              )}
            </div>
          ) : user ? (
            <div
              className={cn(
                "flex items-center justify-between gap-stack-xs p-stack-xs rounded-2xl bg-white border border-sb-border hover:bg-sb-mist-faint transition-ui shadow-2xs",
                pathname === "/profile" ? "ring-2 ring-sb-blue/30 border-sb-blue bg-sb-mist-soft" : "",
                collapsed ? "justify-center p-stack-2xs flex-col gap-stack-2xs" : ""
              )}
            >
              <Link
                href="/profile"
                onClick={() => {
                  if (isMobile && onCloseMobile) onCloseMobile();
                }}
                className={cn(
                  "flex items-center gap-stack-xs min-w-0 flex-1 group cursor-pointer",
                  collapsed ? "justify-center" : ""
                )}
                title={collapsed ? `${user.fullName} (Profil Saya)` : "Buka Profil Saya"}
              >
                <div className="w-8 h-8 rounded-xl bg-sb-mist-soft text-sb-blue font-bold text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:shadow-sm transition-ui">
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
                  "p-stack-2xs rounded-lg text-sb-text-2 hover:text-sb-critical hover:bg-rose-50/80 transition-colors shrink-0 cursor-pointer",
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
                "w-full flex items-center gap-stack-xs px-stack-sm py-stack-xs rounded-full text-xs font-bold bg-sb-blue text-white hover:bg-sb-blue-hover transition-ui shadow-xs",
                collapsed ? "justify-center px-stack-xs" : ""
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
          "hidden md:flex flex-col h-screen sticky top-0 z-40 bg-white border-r border-sb-border transition-[width] duration-200 ease-in-out-strong shrink-0 select-none",
          isCollapsed ? "w-[76px]" : "w-64"
        )}
      >
        {/* Top Header with Logo & Collapse Toggle */}
        <div
          className={cn(
            "h-18 px-stack-md border-b border-sb-border flex items-center shrink-0",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {isCollapsed ? (
            <SkillBridgeLogo size="sm" showText={false} href={isAdmin ? "/admin" : "/dashboard"} />
          ) : (
            <SkillBridgeLogo size="sm" showText={true} href={isAdmin ? "/admin" : "/dashboard"} />
          )}

          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Buka sidebar" : "Lipat sidebar"}
            className={cn(
              "p-stack-2xs rounded-xl text-sb-text-2 hover:text-sb-navy hover:bg-sb-mist-faint transition-colors cursor-pointer",
              isCollapsed ? "hidden" : "block"
            )}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Floating expand button when collapsed */}
        {isCollapsed && (
          <div className="py-stack-xs flex justify-center border-b border-sb-border">
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label="Buka sidebar"
              className="p-stack-2xs rounded-xl text-sb-text-2 hover:text-sb-navy hover:bg-sb-mist-faint transition-colors cursor-pointer"
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
            className="fixed inset-0 bg-black/30 backdrop-blur-xs animate-fade-in"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-50 animate-slide-in-left border-r border-sb-border">
            <div className="h-18 px-stack-lg border-b border-sb-border flex items-center justify-between">
              <SkillBridgeLogo size="sm" href={isAdmin ? "/admin" : "/dashboard"} />
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-stack-2xs rounded-xl text-sb-text-2 hover:text-sb-navy hover:bg-sb-mist-faint transition-colors cursor-pointer"
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
