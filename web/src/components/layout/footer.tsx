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
              Platform pencocokan kompetensi CV dan inteligensi skill pasar kerja nyata. Disiapkan untuk INVOFEST 2026.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-xs text-slate-500">
            <Link href="/design-system" className="hover:text-blue-600 transition-colors">
              Design System
            </Link>
            <Link href="/cv" className="hover:text-blue-600 transition-colors">
              Analisis CV
            </Link>
            <Link href="/jobs" className="hover:text-blue-600 transition-colors">
              Job Explorer
            </Link>
            <Link href="/insights" className="hover:text-blue-600 transition-colors">
              Market Skill Insights
            </Link>
            <Link href="/login" className="hover:text-blue-600 transition-colors">
              Demo Juri
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2026 SkillBridge. Seluruh hak cipta dilindungi.</p>
          <p>SDG 8 (Decent Work & Economic Growth) & SDG 10 (Reduced Inequalities)</p>
        </div>
      </div>
    </footer>
  );
}

