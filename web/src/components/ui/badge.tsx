import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowUpCircle,
  HelpCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MATCH_STATUS_LABELS, getMatchStatusLabel } from "@/lib/matching-config";
import type { MatchStatusReason } from "@/lib/matching";

// -----------------------------------------------------------------------------
// Match Status Badge
// -----------------------------------------------------------------------------
export type MatchStatus =
  | "match"
  | "underqualified"
  | "potentially_overqualified"
  | "insufficient_evidence";

interface MatchBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: MatchStatus;
  reason?: MatchStatusReason | null;
  score?: number | null;
  size?: "sm" | "md" | "lg";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MatchBadge({ status, reason, score, size = "md", className, ...props }: MatchBadgeProps) {
  const sizeClasses =
    size === "sm"
      ? "px-stack-xs py-stack-3xs text-xs gap-stack-2xs"
      : size === "lg"
      ? "px-stack-md py-stack-xs text-sm gap-stack-xs"
      : "px-stack-sm py-stack-2xs text-xs gap-stack-2xs";

  const config: Record<
    MatchStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    match: {
      label: MATCH_STATUS_LABELS.match,
      bg: "bg-emerald-50",
      text: "text-sb-good",
      border: "border-emerald-200",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-sb-good shrink-0" aria-hidden="true" />,
    },
    underqualified: {
      label: MATCH_STATUS_LABELS.underqualified,
      bg: "bg-amber-50",
      text: "text-sb-warning",
      border: "border-amber-200",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-sb-warning shrink-0" aria-hidden="true" />,
    },
    potentially_overqualified: {
      label: MATCH_STATUS_LABELS.potentially_overqualified,
      bg: "bg-sb-mist-soft",
      text: "text-sb-blue",
      border: "border-sb-mist",
      icon: <ArrowUpCircle className="w-3.5 h-3.5 text-sb-blue shrink-0" aria-hidden="true" />,
    },
    insufficient_evidence: {
      label: MATCH_STATUS_LABELS.insufficient_evidence,
      bg: "bg-sb-mist-soft",
      text: "text-sb-navy",
      border: "border-sb-border",
      icon: <HelpCircle className="w-3.5 h-3.5 text-sb-text-2 shrink-0" aria-hidden="true" />,
    },
  };

  const current = config[status];

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center font-semibold rounded-full border shadow-2xs select-none whitespace-nowrap",
        sizeClasses,
        current.bg,
        current.text,
        current.border,
        className
      )}
      {...props}
    >
      {current.icon}
      <span className="min-w-0">{getMatchStatusLabel(status, reason)}</span>
    </span>
  );
}

// -----------------------------------------------------------------------------
// Skill Comparison Badge (Terbukti di CV / Belum ditemukan / Belum cukup bukti)
// -----------------------------------------------------------------------------
export type CVSkillStatus = "found" | "missing" | "needs_verification" | "matched" | "insufficient";

interface CVSkillBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  skillName?: string;
  status: CVSkillStatus;
  isMandatory?: boolean;
  compact?: boolean;
}

export function CVSkillBadge({
  skillName,
  status,
  isMandatory = false,
  compact = false,
  className,
  ...props
}: CVSkillBadgeProps) {
  const isFound = status === "found" || status === "matched";
  const isMissing = status === "missing";

  const padding = compact ? "px-stack-xs py-stack-3xs text-xs" : "px-stack-sm py-stack-2xs text-xs";

  if (isFound) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-stack-2xs font-semibold rounded-full bg-emerald-50 text-sb-good border border-emerald-200 select-none",
          padding,
          className
        )}
        {...props}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-sb-good shrink-0" aria-hidden="true" />
        {skillName && <span className="font-bold text-sb-navy">{skillName}</span>}
        {isMandatory && (
          <span className="text-xs uppercase font-bold px-stack-2xs rounded bg-emerald-100 text-sb-good">
            Wajib
          </span>
        )}
        <span className={skillName ? "pl-stack-2xs border-l border-emerald-300/50 text-[11px]" : ""}>
          Terbukti di CV
        </span>
      </span>
    );
  }

  if (isMissing) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-stack-2xs font-semibold rounded-full bg-sb-mist-faint text-sb-text-2 border border-sb-border select-none",
          padding,
          className
        )}
        {...props}
      >
        <XCircle className="w-3.5 h-3.5 text-sb-critical shrink-0" aria-hidden="true" />
        {skillName && <span className="font-bold text-sb-navy">{skillName}</span>}
        {isMandatory && (
          <span className="text-xs uppercase font-bold px-stack-2xs rounded bg-rose-100 text-sb-critical">
            Wajib
          </span>
        )}
        <span className={skillName ? "pl-stack-2xs border-l border-sb-border text-[11px]" : ""}>
          Belum ditemukan di CV
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-stack-2xs font-semibold rounded-full bg-amber-50 text-sb-warning border border-amber-200 select-none",
        padding,
        className
      )}
      {...props}
    >
      <HelpCircle className="w-3.5 h-3.5 text-sb-warning shrink-0" aria-hidden="true" />
      {skillName && <span className="font-bold text-sb-navy">{skillName}</span>}
      {isMandatory && (
        <span className="text-xs uppercase font-bold px-stack-2xs rounded bg-amber-100 text-sb-warning">
          Wajib
        </span>
      )}
      <span className={skillName ? "pl-stack-2xs border-l border-amber-300 text-[11px]" : ""}>
        Belum cukup bukti
      </span>
    </span>
  );
}
