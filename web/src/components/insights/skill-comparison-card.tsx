import { Plus, CheckCircle2, MinusCircle, HelpCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/copy";
import type { TopSkillInsight } from "@/types/insights";

type CvStatus = TopSkillInsight["cvStatus"];

const STATUS_BADGE_CLASS: Record<CvStatus, string> = {
  tercantum: "bg-emerald-50 text-sb-good border-emerald-200",
  perlu_verifikasi: "bg-amber-50 text-sb-warning border-amber-200",
  belum_ditemukan: "bg-sb-mist-faint text-sb-text-2 border-sb-border",
};

function StatusIcon({ status }: { status: CvStatus }) {
  if (status === "tercantum") return <CheckCircle2 className="w-5 h-5 text-sb-good shrink-0 mt-0.5" />;
  if (status === "perlu_verifikasi") return <HelpCircle className="w-5 h-5 text-sb-warning shrink-0 mt-0.5" />;
  return <MinusCircle className="w-5 h-5 text-sb-text-2 shrink-0 mt-0.5" />;
}

interface SkillRowProps {
  item: TopSkillInsight;
  isGuest: boolean;
  sampleSizeN: number;
  onClaim: (skillName: string) => void;
  onAddLearning: (skillName: string) => void;
}

function SkillRow({ item, isGuest, sampleSizeN, onClaim, onAddLearning }: SkillRowProps) {
  return (
    <div className="p-4 rounded-xl border border-sb-border bg-white/70 hover:bg-white hover:border-sb-blue/30 transition-ui flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-start gap-3">
        {!isGuest && <StatusIcon status={item.cvStatus} />}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-sb-navy">{item.skillName}</strong>
            <span className="text-[11px] text-sb-text-2">
              Diminta di <strong className="font-mono-metric font-semibold text-sb-navy">{item.frequencyCount}</strong> dari {sampleSizeN} lowongan (<span className="font-mono-metric text-sb-blue font-semibold">{formatPercent(item.percentage)}%</span>)
            </span>
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-sb-mist-soft text-sb-navy border border-sb-border">
              {item.category}
            </span>
          </div>
          <p className="text-sb-text-2 mt-0.5 line-clamp-1 italic text-[11px]">
            Contoh persyaratan: &ldquo;{item.exampleRequirement}&rdquo;
          </p>
        </div>
      </div>

      {!isGuest && (
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0 pl-8 sm:pl-0">
          <span
            className={cn(
              "px-3 py-1 rounded-full font-semibold text-[11px] border",
              STATUS_BADGE_CLASS[item.cvStatus]
            )}
          >
            {item.statusLabel}
          </span>

          {item.cvStatus === "belum_ditemukan" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onClaim(item.skillName)}
                className="text-xs"
                title="Tandai skill yang kamu kuasai namun belum tertulis di dokumen CV"
              >
                <Check className="w-3.5 h-3.5 mr-1 text-sb-text-2" />
                Saya Kuasai
              </Button>
              <Button variant="primary" size="sm" onClick={() => onAddLearning(item.skillName)} className="text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Pelajari
              </Button>
            </>
          )}

          {item.cvStatus === "perlu_verifikasi" && (
            <Button variant="outline" size="sm" onClick={() => onAddLearning(item.skillName)} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1 text-sb-blue" />
              Target Belajar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface SkillComparisonCardProps {
  skills: TopSkillInsight[];
  isGuest: boolean;
  sampleSizeN: number;
  onClaim: (skillName: string) => void;
  onAddLearning: (skillName: string) => void;
}

/** Daftar frekuensi skill pasar; untuk pengguna login ditambah status CV dan aksinya. */
export function SkillComparisonCard({ skills, isGuest, sampleSizeN, onClaim, onAddLearning }: SkillComparisonCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isGuest ? "Daftar Frekuensi Kebutuhan Skill" : "Perbandingan Skill Pasar vs CV-mu"}</CardTitle>
        <CardDescription>
          {isGuest
            ? "Peringkat skill berdasarkan frekuensi kemunculannya pada persyaratan kualifikasi lowongan."
            : "Status keahlian dinyatakan secara jelas: Tercantum di CV, Perlu verifikasi, atau Belum ditemukan di CV."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {skills.map((item) => (
          <SkillRow
            key={item.skillName}
            item={item}
            isGuest={isGuest}
            sampleSizeN={sampleSizeN}
            onClaim={onClaim}
            onAddLearning={onAddLearning}
          />
        ))}
      </CardContent>
    </Card>
  );
}
