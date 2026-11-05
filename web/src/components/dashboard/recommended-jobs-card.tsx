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
    <div className={cn("glass-panel rounded-2xl p-5 sm:p-6 shadow-2xs lift-card space-y-4 border border-sb-border", wide ? "lg:col-span-12" : "lg:col-span-8")}>
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
        <div className="py-10 text-center text-xs text-sb-text-2 border border-dashed rounded-2xl border-sb-border space-y-2 bg-white/40">
          <p>Belum ada data lowongan yang dimuat.</p>
          <Link href="/jobs">
            <Button variant="outline" size="sm">
              Cari Lowongan
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.slice(0, SHOWN_JOBS).map((job) => (
            <div
              key={job.id}
              className="p-4 rounded-xl border border-sb-border bg-white/70 hover:bg-white hover:border-sb-blue transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs font-bold text-sb-navy truncate max-w-[240px] sm:max-w-[320px]">
                    {formatJobTitle(job.title)}
                  </h4>
                  <MatchBadge status={job.matchStatus} score={job.matchScore} />
                </div>
                <p className="text-[11px] text-sb-text-2 font-medium">
                  {job.company} • {job.location}
                </p>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {job.matchedSkills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sb-good/10 text-sb-good border border-sb-good/30 text-xs font-semibold"
                    >
                      <Check className="w-2.5 h-2.5 text-sb-good" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
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
