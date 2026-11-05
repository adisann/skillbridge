import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Spinner
// -----------------------------------------------------------------------------
export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="inline-flex items-center gap-2 text-blue-600">
      <Loader2 className={cn("animate-spin shrink-0", sizeMap[size], className)} />
      {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Skeletons
// -----------------------------------------------------------------------------
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2 animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 bg-slate-200 rounded"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "p-5 rounded-xl border border-slate-200 bg-white animate-pulse space-y-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 w-3/4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-5 bg-slate-300 rounded w-2/3" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
        <div className="w-20 h-7 bg-slate-200 rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-slate-200 rounded" />
        <div className="h-6 w-20 bg-slate-200 rounded" />
        <div className="h-6 w-24 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("border border-slate-200 rounded-xl bg-white overflow-hidden animate-pulse", className)}>
      <div className="h-10 bg-slate-100 border-b border-slate-200" />
      <div className="divide-y divide-slate-100 p-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="py-3 flex items-center justify-between gap-4">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-1/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

