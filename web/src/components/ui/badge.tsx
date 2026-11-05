import React from "react";
import { Check, HelpCircle, MinusCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Base Badge
// -----------------------------------------------------------------------------
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "secondary",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-blue-50 text-blue-700 border-blue-200",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    outline: "bg-transparent text-slate-600 border-slate-300",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-md border select-none transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// -----------------------------------------------------------------------------
// Match Status Badge
// -----------------------------------------------------------------------------
export type MatchStatus =
  | "match"
  | "underqualified"
  | "potentially_overqualified"
  | "insufficient_evidence";

export interface MatchBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: MatchStatus;
  score?: number | null; // e.g. 85 -> 85%
}

export function MatchBadge({ status, score, className, ...props }: MatchBadgeProps) {
  const config: Record<
    MatchStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    match: {
      label: "Match",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-300",
      icon: <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />,
    },
    underqualified: {
      label: "Underqualified",
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-300",
      icon: <MinusCircle className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.5} />,
    },
    potentially_overqualified: {
      label: "Potentially Overqualified",
      bg: "bg-indigo-50",
      text: "text-indigo-800",
      border: "border-indigo-300",
      icon: <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600" strokeWidth={1.5} />,
    },
    insufficient_evidence: {
      label: "Belum ada skor",
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-300",
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-500" />,
    },
  };

  const current = config[status];
  const shouldShowScore = score != null && status !== "insufficient_evidence";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border shadow-2xs select-none whitespace-nowrap shrink-0",
        current.bg,
        current.text,
        current.border,
        className
      )}
      {...props}
    >
      {current.icon}
      <span>{current.label}</span>
      {shouldShowScore && (
        <span className="ml-1 pl-1.5 border-l border-current/30 font-bold font-mono">
          {score}%
        </span>
      )}
    </span>
  );
}

// -----------------------------------------------------------------------------
// Skill Status Badge
// Status nonwarna: wajib teks eksplisit "tercantum di CV" / "belum ditemukan"
// -----------------------------------------------------------------------------
export type CVSkillStatus = "found" | "missing" | "needs_verification";

export interface CVSkillBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  skillName: string;
  status: CVSkillStatus;
  isMandatory?: boolean;
}

export function CVSkillBadge({
  skillName,
  status,
  isMandatory = false,
  className,
  ...props
}: CVSkillBadgeProps) {
  const configs: Record<
    CVSkillStatus,
    { label: string; icon: React.ReactNode; cls: string }
  > = {
    found: {
      label: "Tercantum di CV",
      icon: <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />,
      cls: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    missing: {
      label: "Belum ditemukan",
      icon: <MinusCircle className="w-3 h-3 text-amber-600" />,
      cls: "bg-slate-50 text-slate-700 border-slate-200",
    },
    needs_verification: {
      label: "Perlu verifikasi",
      icon: <HelpCircle className="w-3 h-3 text-blue-500" />,
      cls: "bg-blue-50 text-blue-800 border-blue-200",
    },
  };

  const curr = configs[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors duration-150",
        curr.cls,
        className
      )}
      {...props}
    >
      <span className="font-semibold text-slate-900">{skillName}</span>
      {isMandatory && (
        <span className="text-[10px] uppercase font-bold tracking-wider px-1 rounded bg-slate-200/60 text-slate-700">
          Wajib
        </span>
      )}
      <span className="inline-flex items-center gap-1 text-[11px] opacity-90 pl-1 border-l border-current/20 font-medium">
        {curr.icon}
        {curr.label}
      </span>
    </div>
  );
}

