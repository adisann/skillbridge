import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Spinner
// -----------------------------------------------------------------------------
interface SpinnerProps {
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
    <div className="inline-flex items-center gap-2 text-sb-blue">
      <Loader2 className={cn("animate-spin shrink-0", sizeMap[size], className)} />
      {label && <span className="text-xs font-medium text-sb-text-2">{label}</span>}
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
          className="h-3.5 bg-sb-mist-soft rounded"
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
        "p-5 rounded-2xl border border-sb-border bg-white/80 animate-pulse space-y-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 w-3/4">
          <div className="h-4 bg-sb-mist-soft rounded w-1/3" />
          <div className="h-5 bg-sb-mist rounded w-2/3" />
          <div className="h-3 bg-sb-mist-soft rounded w-1/2" />
        </div>
        <div className="w-20 h-7 bg-sb-mist-soft rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-sb-mist-soft rounded" />
        <div className="h-6 w-20 bg-sb-mist-soft rounded" />
        <div className="h-6 w-24 bg-sb-mist-soft rounded" />
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
    <div className={cn("border border-sb-border rounded-2xl bg-white/80 overflow-hidden animate-pulse", className)}>
      <div className="h-10 bg-sb-mist-faint border-b border-sb-border" />
      <div className="divide-y divide-sb-mist-soft p-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="py-3 flex items-center justify-between gap-4">
            <div className="h-4 bg-sb-mist-soft rounded w-1/4" />
            <div className="h-4 bg-sb-mist-soft rounded w-1/4" />
            <div className="h-4 bg-sb-mist-soft rounded w-1/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

