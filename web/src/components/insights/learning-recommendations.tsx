import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LearningRec } from "@/types/insights";

interface LearningRecommendationsProps {
  recommendations: LearningRec[];
  onAdd: (rec: LearningRec) => void;
}

/** Skill dengan permintaan tertinggi yang belum ditemukan di CV pengguna. */
export function LearningRecommendations({ recommendations, onAdd }: LearningRecommendationsProps) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-sb-border space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-sb-mist-soft flex items-center justify-center text-sb-blue">
          <Target className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-sb-navy">Rekomendasi Belajar</h3>
          <p className="text-xs text-sb-text-2 mt-0.5">
            Skill berikut memiliki frekuensi permintaan tertinggi di lowongan namun belum ditemukan di CV-mu:
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
        {recommendations.map((rec) => (
          <div
            key={rec.skillName}
            className="p-4 rounded-xl bg-white/80 border border-sb-border hover:border-sb-blue/30 shadow-2xs space-y-3 flex flex-col justify-between transition-ui"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sb-navy text-sm">{rec.skillName}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sb-mist-soft text-sb-blue border border-sb-border font-mono-metric">
                  {rec.demandPercentage}% Lowongan
                </span>
              </div>
              <p className="text-xs text-sb-text-2 leading-relaxed">{rec.reason}</p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAdd(rec)}
                className="w-full text-xs text-sb-navy hover:text-sb-blue hover:bg-sb-mist-soft border-sb-border"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah ke Target Belajar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
