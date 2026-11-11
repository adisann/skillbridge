"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobStage } from "@/types/tracker";

const STAGES: ReadonlyArray<{ key: JobStage; label: string; color: string }> = [
  { key: "bookmarked", label: "Tersimpan", color: "text-sb-navy" },
  { key: "applying", label: "Siapkan Berkas", color: "text-sb-blue" },
  { key: "applied", label: "Sudah Melamar", color: "text-sb-blue" },
  { key: "interviewing", label: "Wawancara", color: "text-amber-600" },
  { key: "offered", label: "Penawaran", color: "text-emerald-600" },
  { key: "accepted", label: "Diterima", color: "text-sb-good" },
  { key: "rejected", label: "Ditolak", color: "text-sb-critical" },
];

interface ApplicationStagesCardProps {
  stageCounts: Record<JobStage, number>;
  totalTracked: number;
}

export function ApplicationStagesCard({ stageCounts, totalTracked }: ApplicationStagesCardProps) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const visibleStages = expanded ? STAGES : STAGES.slice(0, 4);
  return (
    <div className="lg:col-span-12 glass-panel rounded-2xl p-stack-lg sm:p-stack-xl shadow-2xs lift-card space-y-stack-sm border border-sb-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-stack-xs">
        <div>
          <h3 className="text-base font-bold text-sb-navy">
            Status Lamaran ({totalTracked} posisi tersimpan)
          </h3>
        </div>
        <Link href="/tracker">
          <span className="text-xs font-semibold text-sb-blue hover:text-sb-navy flex items-center gap-stack-2xs">
            Buka Tracker <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>

      <div id={id} className={cn("grid grid-cols-2 sm:grid-cols-4 gap-stack-xs", expanded && "xl:grid-cols-7")}>
        {visibleStages.map((stage) => (
          <Link
            key={stage.key}
            href={`/tracker?stage=${stage.key}`}
            className="px-stack-sm py-stack-xs rounded-xl border border-sb-border bg-white/70 hover:bg-white hover:border-sb-blue hover:shadow-2xs transition-ui flex flex-col justify-between gap-stack-2xs min-w-0"
          >
            <p className="text-xs font-bold text-sb-text-2 whitespace-normal break-words">
              {stage.label}
            </p>
            <p className={cn("text-lg font-extrabold tracking-tight font-mono-metric", stage.color)}>
              {stageCounts[stage.key]}
            </p>
          </Link>
        ))}
      </div>
      <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((value) => !value)}
        className="inline-flex items-center gap-stack-2xs rounded-lg py-stack-2xs text-xs font-semibold text-sb-blue hover:text-sb-blue-hover focus-visible:outline-2 focus-visible:outline-sb-blue">
        {expanded ? "Tampilkan lebih sedikit" : "Tampilkan semua status"}
        <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
      </button>
    </div>
  );
}
