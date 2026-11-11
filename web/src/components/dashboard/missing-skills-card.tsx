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
    <div className="lg:col-span-4 glass-panel rounded-2xl p-stack-lg sm:p-stack-xl shadow-2xs lift-card space-y-stack-md flex flex-col justify-between border border-sb-border">
      <div className="space-y-stack-sm">
        <div>
          <h3 className="text-base font-bold text-sb-navy">
            Skill yang belum ada di CV&#8209;mu
          </h3>
        </div>

        {missingSkills.length === 0 ? (
          <div className="py-stack-2xl text-center text-xs text-sb-text-2 border border-dashed rounded-2xl border-sb-border bg-white/40">
            Skill di CV&#8209;mu sudah mencakup sebagian besar kebutuhan lowongan target di bidang ini.
          </div>
        ) : (
          <div className="space-y-stack-xs">
            {missingSkills.map((rec) => (
              <div
                key={rec.skillName}
                className="p-stack-sm rounded-xl border border-sb-border bg-white/70 space-y-stack-2xs hover:border-sb-blue/40 transition-ui"
              >
                <div className="flex flex-wrap items-center justify-between gap-stack-2xs text-xs font-bold">
                  <span className="text-sb-navy">{rec.skillName}</span>
                  <span className="text-sb-blue font-mono-metric">{formatPercent(rec.percentage)}% lowongan target</span>
                </div>
                <p className="text-xs text-sb-text-2">
                  Diminta di {rec.frequency} lowongan target aktif
                </p>
              </div>
            ))}
          </div>
        )}

        {priorityJobs.length > 0 && (
          <div className="space-y-stack-xs pt-stack-xs border-t border-sb-border">
            <p className="text-xs font-bold uppercase tracking-wider text-sb-text-2">
              Target Prioritas:
            </p>
            <div className="space-y-stack-2xs text-xs">
              {priorityJobs.map((j) => (
                <Link
                  key={j.id}
                  href="/tracker"
                  className="p-stack-xs rounded-xl bg-white/70 border border-sb-border hover:border-sb-blue/40 hover:bg-white transition-ui flex items-center justify-between"
                >
                  <div className="min-w-0 pr-stack-xs">
                    <p className="font-bold text-sb-navy truncate text-xs">{j.title}</p>
                    <p className="text-xs text-sb-text-2 truncate">{j.company}</p>
                  </div>
                  <div className="flex items-center gap-stack-3xs text-sb-warning shrink-0">
                    <Star className="w-3 h-3 fill-sb-warning text-sb-warning" />
                    <span className="text-xs font-bold text-sb-navy font-mono-metric">{j.priority}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-stack-xs border-t border-sb-border space-y-stack-xs">
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
