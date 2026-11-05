import React from "react";
import Link from "next/link";
import { SkillBridgeLogo } from "../ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-sb-border bg-white/70 backdrop-blur-md text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <SkillBridgeLogo size="sm" />

        <div className="flex items-center gap-6 text-xs text-sb-text-2 font-medium">
          <Link href="/lowongan" className="hover:text-sb-navy transition-colors">
            Lowongan
          </Link>
          <Link href="/tren-skill" className="hover:text-sb-navy transition-colors">
            Tren Skill
          </Link>
          <Link href="/login" className="hover:text-sb-navy transition-colors">
            Masuk
          </Link>
        </div>

        <div className="text-xs text-sb-text-2/80 shrink-0">
          © 2026 SkillBridge.
        </div>
      </div>
    </footer>
  );
}
