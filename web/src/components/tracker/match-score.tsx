import { cn } from "@/lib/utils";
import type { TrackedJob } from "@/types/tracker";
import { getMatchStatusLabel } from "@/lib/matching-config";

const TONE: Record<TrackedJob["matchStatus"], { text: string; bar: string }> = {
  match: { text: "text-sb-good", bar: "bg-sb-good" },
  underqualified: { text: "text-sb-warning", bar: "bg-sb-warning" },
  potentially_overqualified: { text: "text-sb-blue", bar: "bg-sb-sky" },
  insufficient_evidence: { text: "text-sb-text-2", bar: "bg-sb-mist" },
};

/** Persentase kecocokan CV + label status (label tetap ada, jadi tidak bergantung pada warna). */
export function MatchScore({
  score,
  status,
  reason,
  size = "md",
}: {
  score: number | null | undefined;
  status: TrackedJob["matchStatus"];
  reason?: TrackedJob["matchStatusReason"];
  size?: "md" | "lg";
}) {
  const hasScore = status !== "insufficient_evidence" && typeof score === "number" && Number.isFinite(score) && score >= 0;
  const value = hasScore ? Math.round(Math.min(100, Math.max(0, score))) : null;
  const tone = TONE[status] ?? TONE.insufficient_evidence;

  return (
    // Disusun per baris: persentase → bar → label status (label tidak lagi berdampingan dan terlipat)
    <div className={cn("min-w-[7.5rem] flex flex-col", size === "lg" ? "gap-stack-2xs" : "gap-stack-2xs")}>
      <span className={cn("font-extrabold font-mono-metric leading-none", size === "lg" ? "text-2xl" : "text-base", value === null ? "text-sb-text-2" : "text-sb-navy")}>
        {value === null ? "–" : `${value}%`}
      </span>
      <div className="h-1.5 w-full rounded-full bg-sb-mist-soft overflow-hidden" aria-hidden="true">
        <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${value ?? 0}%` }} />
      </div>
      <span className={cn("font-semibold leading-snug", size === "lg" ? "text-sm" : "text-xs", tone.text)}>{getMatchStatusLabel(status, reason)}</span>
    </div>
  );
}
