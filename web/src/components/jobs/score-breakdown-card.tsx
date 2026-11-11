import { Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/copy";
import type { ScoreBreakdownEntry } from "@/types/job";

function BreakdownItem({ entry }: { entry: ScoreBreakdownEntry }) {
  const displayWeight = formatPercent(entry.weight);
  const displayScore = formatPercent(entry.score);
  const isAvailable = entry.available ?? displayWeight > 0;

  return (
    <div
      className={cn(
        "p-stack-sm rounded-xl border border-sb-border space-y-stack-2xs transition-ui",
        isAvailable ? "bg-white/70" : "bg-sb-mist-faint/40 opacity-75"
      )}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-sb-text-2">{entry.label}</span>
        <span
          className={cn(
            "text-[11px] font-mono-metric font-semibold",
            isAvailable ? "text-sb-navy" : "text-sb-text-2/60"
          )}
        >
          {isAvailable ? `${displayWeight}%` : "0% (N/A)"}
        </span>
      </div>
      <div className="text-xl font-extrabold text-sb-navy font-mono-metric">
        {isAvailable ? (
          <>
            {displayScore}
            <span className="text-xs text-sb-text-2 font-normal">/100</span>
          </>
        ) : (
          <span className="text-base font-semibold text-sb-text-2/60">—</span>
        )}
      </div>
      <div className="w-full bg-sb-mist-soft rounded-full h-1.5 overflow-hidden">
        <div
          className={cn("h-1.5 rounded-full transition-[width] duration-300 ease-out-strong", isAvailable ? "bg-sb-sky" : "bg-sb-border")}
          style={{ width: isAvailable ? `${displayScore}%` : "0%" }}
        />
      </div>
      <p className="text-[10px] text-sb-text-2/70 truncate">
        {isAvailable ? entry.notes || "Dievaluasi dari CV" : "Tidak disyaratkan di lowongan"}
      </p>
    </div>
  );
}

export function ScoreBreakdownCard({ breakdown }: { breakdown: ScoreBreakdownEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-stack-2xs">
          <CardTitle className="flex items-center gap-stack-xs">
            <Layers className="w-5 h-5 text-sb-blue" />
            Rincian Komponen Skor
          </CardTitle>
          <p className="text-xs text-sb-text-2">
            Skor menunjukkan kecocokan CV dengan persyaratan, bukan peluang diterima.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-stack-sm">
          {breakdown.map((entry) => (
            <BreakdownItem key={entry.label} entry={entry} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
