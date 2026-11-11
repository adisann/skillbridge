import React from "react";
import Link from "next/link";
import { SkillBridgeLogo } from "../ui/logo";
import { UI_COPY } from "@/lib/copy";

export function Footer() {
  return (
    <footer className="border-t border-sb-border bg-white text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-stack-md sm:px-stack-xl lg:px-stack-2xl py-stack-xl flex flex-col sm:flex-row items-center justify-between gap-stack-md">
        <div className="flex flex-col items-center sm:items-start gap-stack-2xs">
          <SkillBridgeLogo size="sm" />
          <span className="text-xs text-sb-text-2">{UI_COPY.tagline}</span>
        </div>

        <div className="flex items-center gap-stack-xl text-xs text-sb-text-2 font-medium">
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
