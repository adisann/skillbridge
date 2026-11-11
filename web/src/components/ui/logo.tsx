import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
}

/**
 * Satu-satunya sumber bentuk logo SkillBridge: dua pilar dan satu lengkung (jembatan)
 * yang menyatukan keahlian kandidat dengan kebutuhan dunia kerja.
 * Dipakai komponen di bawah dan disalin apa adanya ke `app/icon.svg` (favicon).
 */
const SKILLBRIDGE_MARK_VIEWBOX = "0 0 100 60";
const SKILLBRIDGE_MARK_PATH =
  "M0 60V0H19V20C19 9 33 2 50 2C67 2 81 9 81 20V0H100V60H81V40C81 27 67 18 50 18C33 18 19 27 19 40V60Z";

/** Tanda logo. Warna mengikuti `currentColor`, ukuran lewat `className` (mis. `h-6 w-auto`). */
function SkillBridgeMark({ className }: { className?: string }) {
  return (
    <svg viewBox={SKILLBRIDGE_MARK_VIEWBOX} className={className} aria-hidden="true" focusable="false">
      <path d={SKILLBRIDGE_MARK_PATH} fill="currentColor" />
    </svg>
  );
}

export function SkillBridgeLogo({
  className,
  size = "md",
  showText = true,
  href = "/",
}: LogoProps) {
  const markSizes = {
    sm: "h-3.5 w-auto",
    md: "h-[18px] w-auto",
    lg: "h-6 w-auto",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  };

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-stack-xs text-sb-blue select-none",
        className
      )}
    >
      <SkillBridgeMark className={cn("shrink-0", markSizes[size])} />
      {showText && (
        <span className={cn("font-display font-semibold tracking-[-0.02em] leading-none", textSizes[size])}>
          SkillBridge
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="SkillBridge, ke beranda"
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-blue rounded-xl transition-transform duration-150 ease-out-strong active:scale-[0.97] inline-flex"
      >
        {content}
      </Link>
    );
  }

  return content;
}
