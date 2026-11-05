import React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";
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
    sm: "h-7 w-7 rounded-lg",
    md: "h-9 w-9 rounded-xl",
    lg: "h-11 w-11 rounded-2xl",
  };

  const compassSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-bold tracking-tight select-none",
        className
      )}
    >
      {/* Box icon rounded with sky-mist gradient, navy compass, ring-1 ring-white/50, and soft shadow */}
      <span
        className={cn(
          "flex items-center justify-center text-sb-navy shrink-0 bg-gradient-to-br from-sb-sky to-sb-mist shadow-xs ring-1 ring-white/60",
          iconSizes[size]
        )}
        aria-hidden="true"
      >
        <Compass className={compassSizes[size]} strokeWidth={2.4} />
      </span>

      {showText && (
        <span
          className={cn(
            "font-extrabold tracking-[-0.03em] text-sb-navy",
            textSizes[size]
          )}
        >
          Skill<span className="text-sb-blue">Bridge</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-blue rounded-xl transition-transform active:scale-95 inline-flex"
      >
        {content}
      </Link>
    );
  }

  return content;
}
