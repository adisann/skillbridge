import React from "react";
import { cn } from "@/lib/utils";

interface PixelBridgeProps {
  className?: string;
  variant?: "hero" | "divider" | "compact";
}

export function PixelBridge({ className, variant = "hero" }: PixelBridgeProps) {
  if (variant === "divider") {
    return (
      <div
        className={cn("flex items-center justify-center gap-stack-2xs py-stack-xl select-none opacity-60", className)}
        aria-hidden="true"
      >
        <span className="w-1.5 h-1.5 rounded-xs bg-sb-mist" />
        <span className="w-2 h-2 rounded-xs bg-sb-mist" />
        <span className="w-2.5 h-2.5 rounded-xs bg-sb-sky" />
        <span className="w-3 h-3 rounded-xs bg-sb-sky shadow-xs" />
        <span className="w-2.5 h-2.5 rounded-xs bg-sb-sky" />
        <span className="w-2 h-2 rounded-xs bg-sb-mist" />
        <span className="w-1.5 h-1.5 rounded-xs bg-sb-mist" />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn("grid grid-cols-7 gap-stack-2xs w-24 select-none opacity-80", className)}
        aria-hidden="true"
      >
        {/* Row 1 */}
        <span className="w-2 h-2 rounded-2xs bg-transparent" />
        <span className="w-2 h-2 rounded-2xs bg-transparent" />
        <span className="w-2 h-2 rounded-2xs bg-transparent" />
        <span className="w-2 h-2 rounded-2xs bg-sb-sky shadow-xs" />
        <span className="w-2 h-2 rounded-2xs bg-transparent" />
        <span className="w-2 h-2 rounded-2xs bg-transparent" />
        <span className="w-2 h-2 rounded-2xs bg-transparent" />

        {/* Row 2 */}
        <span className="w-2 h-2 rounded-2xs bg-transparent" />
        <span className="w-2 h-2 rounded-2xs bg-sb-mist/60" />
        <span className="w-2 h-2 rounded-2xs bg-sb-sky" />
        <span className="w-2 h-2 rounded-2xs bg-sb-mist" />
        <span className="w-2 h-2 rounded-2xs bg-sb-sky" />
        <span className="w-2 h-2 rounded-2xs bg-sb-mist/60" />
        <span className="w-2 h-2 rounded-2xs bg-transparent" />

        {/* Row 3 */}
        <span className="w-2 h-2 rounded-2xs bg-sb-sky/40" />
        <span className="w-2 h-2 rounded-2xs bg-sb-sky/70" />
        <span className="w-2 h-2 rounded-2xs bg-sb-mist/40" />
        <span className="w-2 h-2 rounded-2xs bg-transparent" />
        <span className="w-2 h-2 rounded-2xs bg-sb-mist/40" />
        <span className="w-2 h-2 rounded-2xs bg-sb-sky/70" />
        <span className="w-2 h-2 rounded-2xs bg-sb-sky/40" />
      </div>
    );
  }

  // Hero Pixel Matrix Bridge SVG
  return (
    <svg
      viewBox="0 0 280 180"
      className={cn("w-full h-auto select-none pointer-events-none", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pixel-sky-grad" x1="0" y1="0" x2="280" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--sb-sky)" stopOpacity="0.85" />
          <stop offset="50%" stopColor="var(--sb-sky)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--sb-mist)" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Ground Foundation Blocks */}
      <rect x="10" y="150" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.35" />
      <rect x="30" y="150" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.5" />
      <rect x="234" y="150" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.5" />
      <rect x="254" y="150" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.35" />

      {/* Left Stepped Pillar */}
      <rect x="30" y="130" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.65" />
      <rect x="50" y="130" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.5" />
      <rect x="50" y="110" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.75" />
      <rect x="70" y="110" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.65" />
      <rect x="70" y="90" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.8" />
      <rect x="90" y="90" width="16" height="16" rx="3" fill="var(--sb-mist)" opacity="0.75" />
      <rect x="90" y="70" width="16" height="16" rx="3" fill="var(--sb-mist)" opacity="0.9" />
      <rect x="110" y="70" width="16" height="16" rx="3" fill="var(--sb-mist)" opacity="0.85" />

      {/* Central Keystone Arch */}
      <rect x="110" y="50" width="16" height="16" rx="3" fill="var(--sb-mist)" opacity="0.95" />
      <rect x="132" y="44" width="18" height="18" rx="4" fill="var(--sb-sky)" />
      <rect x="154" y="50" width="16" height="16" rx="3" fill="var(--sb-mist)" opacity="0.95" />

      {/* Right Stepped Pillar */}
      <rect x="154" y="70" width="16" height="16" rx="3" fill="var(--sb-mist)" opacity="0.85" />
      <rect x="174" y="70" width="16" height="16" rx="3" fill="var(--sb-mist)" opacity="0.9" />
      <rect x="174" y="90" width="16" height="16" rx="3" fill="var(--sb-mist)" opacity="0.75" />
      <rect x="194" y="90" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.8" />
      <rect x="194" y="110" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.65" />
      <rect x="214" y="110" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.75" />
      <rect x="214" y="130" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.5" />
      <rect x="234" y="130" width="16" height="16" rx="3" fill="var(--sb-sky)" opacity="0.65" />

      {/* Deck Roadway Dots */}
      <line x1="40" y1="126" x2="240" y2="126" stroke="var(--sb-mist)" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.7" />
    </svg>
  );
}
