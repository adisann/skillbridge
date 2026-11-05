import React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_DISCLAIMER } from "@/mock";

export function MockDataDisclaimer({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold tracking-wider uppercase bg-amber-50 text-amber-800 border border-amber-200 select-none",
          className
        )}
      >
        <Info className="w-3 h-3 text-amber-600" />
        Data Sampel
      </span>
    );
  }

  return (
    <div
      className={cn(
        "p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-2xs select-none",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium text-[11px] sm:text-xs leading-normal">
          {MOCK_DISCLAIMER}
        </span>
      </div>
      <span className="shrink-0 text-xs uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-900">
        Sampel
      </span>
    </div>
  );
}

export function StateSelector({
  state,
  onChange,
}: {
  state: "loaded" | "loading" | "empty" | "error";
  onChange: (s: "loaded" | "loading" | "empty" | "error") => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-sb-mist-soft p-1 rounded-lg border border-sb-border text-xs select-none">
      <span className="text-xs uppercase font-bold text-sb-text-2 px-1.5">
        Simulasi UI:
      </span>
      {(["loaded", "loading", "empty", "error"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            "px-2 py-0.5 rounded font-medium capitalize transition-all",
            state === s
              ? "bg-white text-sb-blue shadow-2xs font-semibold"
              : "text-sb-text-2 hover:text-sb-navy"
          )}
        >
          {s === "loaded" ? "Data Normal" : s}
        </button>
      ))}
    </div>
  );
}
