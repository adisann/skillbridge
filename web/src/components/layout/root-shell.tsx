"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { Menu } from "lucide-react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { DashboardSidebar } from "./sidebar";
import { SkillBridgeLogo } from "../ui/logo";

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Tandai bahwa client JS siap untuk animasi reveal aman tanpa layar kosong
    document.documentElement.classList.add("js-ready");
  }, []);

  // Halaman publik & autentikasi dasar memakai Navbar horizontal & Footer standar (tanpa sidebar)
  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/lowongan" ||
    pathname.startsWith("/lowongan/") ||
    pathname === "/tren-skill";

  if (isPublicPage) {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  // Halaman Aplikasi (Dashboard, Tracker, Jobs, CV, Insights, Progress, Profile, Admin):
  return (
    <div className="min-h-screen flex font-sans">
      {/* Sidebar Desktop & Mobile Drawer */}
      <DashboardSidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Hamburger Menu button */}
        <header className="md:hidden h-14 px-stack-md bg-white border-b border-sb-border shadow-2xs flex items-center justify-between sticky top-0 z-30 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-stack-xs -ml-stack-xs rounded-xl text-sb-text-2 hover:text-sb-navy hover:bg-sb-mist-faint transition-colors cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <SkillBridgeLogo size="sm" href={isAdmin ? "/admin" : "/dashboard"} />

          {/* Spacer for symmetrical layout */}
          <div className="w-8" />
        </header>

        {/* Dynamic page content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
