import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/lib/copy";
import type { MissingSkill } from "@/lib/dashboard";
import type { TrackedJob } from "@/types/tracker";

interface MissingSkillsCardProps {
  missingSkills: MissingSkill[];
  priorityJobs: TrackedJob[];
}

export function MissingSkillsCard({ missingSkills, priorityJobs }: MissingSkillsCardProps) {
  return (
    <div className="lg:col-span-4 glass-panel rounded-2xl p-5 sm:p-6 shadow-2xs lift-card space-y-4 flex flex-col justify-between border border-sb-border">
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-sb-navy">
            Skill yang belum ada di CV&#8209;mu
          </h3>
        </div>

        {missingSkills.length === 0 ? (
          <div className="py-8 text-center text-xs text-sb-text-2 border border-dashed rounded-2xl border-sb-border bg-white/40">
            Skill di CV&#8209;mu sudah mencakup sebagian besar kebutuhan lowongan di bidang ini.
          </div>
        ) : (
          <div className="space-y-2.5">
            {missingSkills.map((rec) => (
              <div
                key={rec.skillName}
                className="p-3.5 rounded-xl border border-sb-border bg-white/70 space-y-1 hover:border-sb-blue/40 transition-ui"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-sb-navy">{rec.skillName}</span>
                  <span className="text-sb-blue font-mono-metric">{formatPercent(rec.percentage)}% lowongan</span>
                </div>
                <p className="text-xs text-sb-text-2">
                  Diminta di {rec.frequency} lowongan aktif
                </p>
              </div>
            ))}
          </div>
        )}

        {priorityJobs.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-sb-border">
            <p className="text-xs font-bold uppercase tracking-wider text-sb-text-2">
              Target Prioritas:
            </p>
            <div className="space-y-1.5 text-xs">
              {priorityJobs.map((j) => (
                <Link
                  key={j.id}
                  href="/tracker"
                  className="p-2.5 rounded-xl bg-white/70 border border-sb-border hover:border-sb-blue/40 hover:bg-white transition-ui flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-sb-navy truncate text-xs">{j.title}</p>
                    <p className="text-xs text-sb-text-2 truncate">{j.company}</p>
                  </div>
                  <div className="flex items-center gap-0.5 text-sb-warning shrink-0">
                    <Star className="w-3 h-3 fill-sb-warning text-sb-warning" />
                    <span className="text-xs font-bold text-sb-navy font-mono-metric">{j.priority}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-sb-border space-y-2">
        <Link href="/progress" className="block">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between text-xs"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            <span>Lihat Rencana Belajar</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
