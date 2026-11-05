import React from "react";
import Link from "next/link";
import { SkillBridgeLogo } from "../ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <SkillBridgeLogo size="sm" />
            <p className="text-slate-500 max-w-sm text-xs">
              Platform inteligensi karier data dan pencocokan CV terhadap lowongan kerja nyata secara objektif dan transparan.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-xs text-slate-500">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/cv" className="hover:text-blue-600 transition-colors">
              CV Saya
            </Link>
            <Link href="/jobs" className="hover:text-blue-600 transition-colors">
              Cari Lowongan
            </Link>
            <Link href="/insights" className="hover:text-blue-600 transition-colors">
              Skill yang Paling Dicari
            </Link>
            {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && process.env.NODE_ENV !== "production" && (
              <>
                <Link href="/design-system" className="hover:text-blue-600 transition-colors">
                  Design System
                </Link>
                <Link href="/login" className="hover:text-blue-600 transition-colors">
                  Coba dengan akun demo
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2026 SkillBridge. Seluruh hak cipta dilindungi.</p>
          <p>Mendukung Akselerasi Talenta & Efisiensi Perekrutan Kerja Nyata</p>
        </div>
      </div>
    </footer>
  );
}

