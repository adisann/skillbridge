"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { DashboardSidebar } from "./sidebar";
import { SkillBridgeLogo } from "../ui/logo";

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Halaman publik & autentikasi dasar memakai Navbar horizontal & Footer standar
  const isPublicPage =
    pathname === "/" || pathname === "/login" || pathname === "/register";

  if (isPublicPage) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  // Halaman Aplikasi (Dashboard, Tracker, Jobs, CV, Insights, Progress, Admin):
  // Navbar horizontal dihilangkan, digantikan sepenuhnya oleh Sidebar vertikal di sisi kiri
  return (
    <div className="min-h-screen flex bg-slate-50/50 text-slate-900 font-sans">
      {/* Sidebar Desktop & Mobile Drawer */}
      <DashboardSidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Hamburger Menu button */}
        <header className="md:hidden h-14 px-4 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <SkillBridgeLogo size="sm" href="/dashboard" />

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

