import { cn } from "@/lib/utils";
import type { TrackedJob } from "@/types/tracker";

const LABEL: Record<TrackedJob["matchStatus"], string> = {
  match: "Cocok",
  underqualified: "Perlu penguatan skill",
  potentially_overqualified: "Melampaui level posisi",
  insufficient_evidence: "Belum ada skor",
};

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
  size = "md",
}: {
  score: number | null | undefined;
  status: TrackedJob["matchStatus"];
  size?: "md" | "lg";
}) {
  const hasScore = status !== "insufficient_evidence" && typeof score === "number" && score > 0;
  const value = hasScore ? Math.round(Math.min(100, Math.max(0, score))) : null;
  const tone = TONE[status] ?? TONE.insufficient_evidence;

  return (
    <div className={cn("min-w-[7.5rem]", size === "lg" ? "space-y-1.5" : "space-y-1")}>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("font-extrabold font-mono-metric", size === "lg" ? "text-2xl" : "text-base", value === null ? "text-sb-text-2" : "text-sb-navy")}>
          {value === null ? "–" : `${value}%`}
        </span>
        <span className={cn("font-semibold", size === "lg" ? "text-sm" : "text-xs", tone.text)}>{LABEL[status] ?? LABEL.insufficient_evidence}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-sb-mist-soft overflow-hidden" aria-hidden="true">
        <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${value ?? 0}%` }} />
      </div>
    </div>
  );
}
