import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchBadge } from "@/components/ui/badge";
import { cn, formatJobTitle } from "@/lib/utils";
import type { DashboardJob } from "@/lib/dashboard";

const SHOWN_JOBS = 3;

interface RecommendedJobsCardProps {
  jobs: DashboardJob[];
  wide: boolean;
}

export function RecommendedJobsCard({ jobs, wide }: RecommendedJobsCardProps) {
  return (
    <div className={cn("glass-panel rounded-2xl p-stack-lg sm:p-stack-xl shadow-2xs lift-card space-y-stack-md border border-sb-border", wide ? "lg:col-span-12" : "lg:col-span-8")}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-sb-navy">
            Rekomendasi Lowongan
          </h3>
        </div>
        <Link href="/jobs" className="text-xs font-semibold text-sb-blue hover:underline">
          Lihat Semua ({jobs.length})
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="py-stack-3xl text-center text-xs text-sb-text-2 border border-dashed rounded-2xl border-sb-border space-y-stack-xs bg-white/40">
          <p>Belum ada data lowongan yang dimuat.</p>
          <Link href="/jobs">
            <Button variant="outline" size="sm">
              Cari Lowongan
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-stack-sm">
          {jobs.slice(0, SHOWN_JOBS).map((job) => (
            <div
              key={job.id}
              className="p-stack-md rounded-xl border border-sb-border bg-white/70 hover:bg-white hover:border-sb-blue transition-ui flex flex-col sm:flex-row sm:items-center justify-between gap-stack-sm"
            >
              <div className="space-y-stack-2xs min-w-0">
                <div>
                  <h4 className="text-xs font-bold text-sb-navy truncate max-w-[240px] sm:max-w-[320px]">
                    {formatJobTitle(job.title)}
                  </h4>
                </div>
                <p className="text-[11px] text-sb-text-2 font-medium">
                  {job.company} • {job.location}
                </p>
                <MatchBadge status={job.matchStatus} score={job.matchScore} size="sm" />
                <div className="flex flex-wrap gap-stack-2xs pt-stack-3xs">
                  {job.matchedSkills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-stack-2xs px-stack-xs py-stack-3xs rounded-full bg-sb-good/10 text-sb-good border border-sb-good/30 text-xs font-semibold"
                    >
                      <Check className="w-2.5 h-2.5 text-sb-good" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-stack-xs shrink-0">
                <Link href={`/jobs/${job.id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Lihat Detail
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
