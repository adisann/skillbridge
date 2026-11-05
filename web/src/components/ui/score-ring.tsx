import React from "react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/copy";

export interface ScoreRingProps {
  score?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export function ScoreRing({
  score,
  size = "md",
  className,
}: ScoreRingProps) {
  const dimensions = size === "sm" ? 56 : size === "lg" ? 96 : 72;
  const strokeWidth = size === "sm" ? 5 : size === "lg" ? 8 : 6;
  const radius = (dimensions - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const hasScore = score != null && !isNaN(score) && score >= 0;
  const safeScore = hasScore ? formatPercent(score) : 0;
  const offset = hasScore
    ? circumference - (safeScore / 100) * circumference
    : circumference;

  const strokeColor = !hasScore
    ? "var(--sb-mist)"
    : safeScore >= 80
    ? "var(--sb-good)"
    : safeScore >= 65
    ? "var(--sb-warning)"
    : "var(--sb-critical)";

  return (
    <div
      className={cn(
        "relative inline-flex flex-col items-center justify-center shrink-0 select-none",
        className
      )}
      style={{ width: dimensions, height: dimensions }}
      role="progressbar"
      aria-valuenow={hasScore ? safeScore : undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={hasScore ? `Skor kecocokan ${safeScore}%` : "Belum ada skor"}
    >
      <svg
        className="w-full h-full -rotate-90"
        viewBox={`0 0 ${dimensions} ${dimensions}`}
        aria-hidden="true"
      >
        {/* Track circle */}
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="transparent"
          stroke="var(--sb-mist-soft)"
          strokeWidth={strokeWidth}
        />
        {/* Active progress circle */}
        {hasScore && (
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={cn(
            "font-mono-metric font-extrabold text-sb-navy leading-none tracking-tight",
            size === "sm" ? "text-xs" : size === "lg" ? "text-2xl" : "text-base"
          )}
        >
          {hasScore ? `${safeScore}%` : "–"}
        </span>
      </div>
    </div>
  );
}

