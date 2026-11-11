import React from "react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/copy";
import { DEFAULT_MATCHING_THRESHOLDS, MATCH_STATUS_COLORS } from "@/lib/matching-config";
import type { MatchCategory } from "@/lib/matching";

interface ScoreRingProps {
  score?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
  status?: MatchCategory;
}

export function ScoreRing({
  score,
  size = "md",
  className,
  status,
}: ScoreRingProps) {
  const dimensions = size === "sm" ? 56 : size === "lg" ? 96 : 72;
  const strokeWidth = size === "sm" ? 5 : size === "lg" ? 8 : 6;
  const radius = (dimensions - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const hasScore = status !== "insufficient_evidence" && score != null && Number.isFinite(score) && score >= 0;
  const safeScore = hasScore ? formatPercent(score) : 0;
  const offset = hasScore
    ? circumference - (safeScore / 100) * circumference
    : circumference;

  const strokeColor = !hasScore
    ? "var(--sb-mist)"
    : status
    ? MATCH_STATUS_COLORS[status]
    : safeScore >= DEFAULT_MATCHING_THRESHOLDS.matchScoreMin
    ? "var(--sb-good)"
    : "var(--sb-warning)";

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
            className="transition-[stroke-dashoffset] duration-500 ease-out-strong"
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

