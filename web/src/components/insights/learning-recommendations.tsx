import { BookOpen } from "lucide-react";
import { LearningButton } from "@/components/learning-button";
import type { LearningRec } from "@/types/insights";

interface LearningRecommendationsProps {
  recommendations: LearningRec[];
}

/** Skill dengan permintaan tertinggi yang belum ditemukan di CV pengguna. */
export function LearningRecommendations({ recommendations }: LearningRecommendationsProps) {
  return (
    <div className="glass-panel p-stack-xl rounded-2xl border border-sb-border space-y-stack-md">
      <div className="flex items-center gap-stack-xs">
        <div className="w-8 h-8 shrink-0 rounded-full bg-sb-mist-soft flex items-center justify-center text-sb-blue">
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-sb-navy">Rekomendasi Belajar</h3>
          <p className="text-xs text-sb-text-2 mt-stack-3xs">
            Skill berikut memiliki frekuensi permintaan tertinggi di lowongan target namun belum ditemukan di CV-mu:
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-stack-sm pt-stack-xs">
        {recommendations.map((rec) => (
          <div
            key={rec.skillName}
            className="p-stack-md rounded-xl bg-white border border-sb-border hover:border-sb-blue/30 shadow-2xs space-y-stack-sm flex flex-col justify-between transition-ui"
          >
            <div className="space-y-stack-xs">
              <div className="flex flex-wrap items-start justify-between gap-stack-xs">
                <span className="font-bold text-sb-navy text-sm leading-snug min-w-0">{rec.skillName}</span>
                <span className="shrink-0 whitespace-nowrap px-stack-xs py-stack-3xs rounded-full text-xs font-semibold bg-sb-mist-soft text-sb-blue border border-sb-border font-mono-metric">
                  {rec.demandPercentage}% lowongan target
                </span>
              </div>
              <p className="text-xs text-sb-text-2 leading-relaxed">{rec.reason}</p>
            </div>
            <div className="pt-stack-xs">
              <LearningButton skillName={rec.skillName} reason={rec.reason} priority={rec.priority} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
