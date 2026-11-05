import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  return (
    <div className="lg:col-span-12 glass-panel rounded-2xl p-5 sm:p-6 shadow-2xs lift-card space-y-4 border border-sb-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-sb-navy">
            Status Lamaran ({totalTracked} posisi tersimpan)
          </h3>
        </div>
        <Link href="/tracker">
          <span className="text-xs font-semibold text-sb-blue hover:text-sb-navy flex items-center gap-1">
            Buka Tracker <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {STAGES.map((stage) => (
          <Link
            key={stage.key}
            href={`/tracker?stage=${stage.key}`}
            className="p-3.5 rounded-xl border border-sb-border bg-white/70 hover:bg-white hover:border-sb-blue hover:shadow-2xs transition-all flex flex-col justify-between"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-sb-text-2 truncate">
              {stage.label}
            </p>
            <p className={cn("text-xl sm:text-2xl font-extrabold tracking-tight mt-1 font-mono-metric", stage.color)}>
              {stageCounts[stage.key]}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
