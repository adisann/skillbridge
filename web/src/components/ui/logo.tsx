import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
}

export function SkillBridgeLogo({
  className,
  size = "md",
  showText = true,
  href = "/",
}: LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 font-bold tracking-tight select-none", className)}>
      {/* SVG Icon: Jembatan Koneksi & Pertumbuhan Kompetensi */}
      <div className={cn("relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-emerald-500 p-1.5 shadow-sm shadow-blue-500/20 text-white", iconSizes[size])}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Bridge Arch Vector */}
          <path
            d="M3 17C6 11 10 9 12 9C14 9 18 11 21 17"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Support Columns / Cables */}
          <path
            d="M8 12.5V17M12 9V17M16 12.5V17"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="0.5 1.5"
            opacity="0.85"
          />
          {/* Foundation Baseline */}
          <path
            d="M2 18.5H22"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Skill Star / Opportunity Pulse */}
          <circle cx="12" cy="5" r="2" fill="#A7F3D0" />
        </svg>
      </div>

      {showText && (
        <span className={cn("font-extrabold text-slate-900 tracking-tight flex items-center", textSizes[size])}>
          Skill<span className="text-blue-600">Bridge</span>
          <span className="ml-1.5 hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            MVP
          </span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}

