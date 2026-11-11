import { Building2, MapPin, ExternalLink, Bookmark, CalendarClock, Briefcase, MessageSquare, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MatchBadge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { cn, formatJobTitle } from "@/lib/utils";
import { getCategoryBySlug, getCategoryFromTitle } from "@/lib/job-categories";
import { formatDeadlineDate } from "@/lib/job-detail";
import type { JobDetailData } from "@/types/job";
import { SalaryText } from "@/components/ui/salary-text";
import { formatGpa } from "@/lib/gpa";
import { DEMO_JOB_NOTICE } from "@/lib/demo-jobs";
import { MatchExplanation } from "@/components/ui/match-explanation";

interface JobDetailHeaderProps {
  job: JobDetailData;
  isGuest: boolean;
  isSaved: boolean;
  onToggleSave: () => Promise<void>;
  onOpenChat: () => void;
}

export function JobDetailHeader({ job, isGuest, isSaved, onToggleSave, onOpenChat }: JobDetailHeaderProps) {
  const categoryLabel =
    job.categoryLabel ||
    getCategoryBySlug(job.category)?.label ||
    getCategoryFromTitle(job.title, job.canonicalTitle).label;

  return (
    <Card>
      <CardContent className="pt-stack-lg sm:pt-stack-xl space-y-stack-lg">
        {job.isDemo && (
          <p role="note" className="rounded-xl border border-sb-warning/40 bg-sb-warning/10 px-stack-md py-stack-sm text-sm text-sb-navy">
            <strong>Lowongan contoh.</strong> {DEMO_JOB_NOTICE}
          </p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-stack-xl">
          <div className="space-y-stack-sm max-w-2xl">
            <span className="inline-flex px-stack-sm py-stack-2xs rounded-full bg-sb-mist-soft text-sb-navy border border-sb-border text-xs font-bold">
              {categoryLabel}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-sb-navy tracking-tight">
              {formatJobTitle(job.title)}
            </h1>
            <div className="flex flex-wrap items-center gap-x-stack-md gap-y-stack-xs text-xs sm:text-sm text-sb-text-2">
              <span className="flex items-center gap-stack-2xs font-bold text-sb-navy">
                <Building2 className="w-4 h-4 text-sb-blue" />
                {job.company}
              </span>
              <span className="flex items-center gap-stack-2xs">
                <MapPin className="w-4 h-4 text-sb-blue" />
                {job.location}
              </span>
              <span className="flex items-center gap-stack-2xs">
                <Briefcase className="w-4 h-4 text-sb-blue" />
                Tipe: {job.employmentType}
              </span>
              <SalaryText
                salaryMin={job.salaryMin}
                salaryMax={job.salaryMax}
                salaryPeriod={job.salaryPeriod}
                className="gap-stack-2xs"
                iconClassName="w-4 h-4"
              />
              {job.minGpa != null && (
                <span className="flex items-center gap-stack-2xs">
                  <GraduationCap className="w-4 h-4 text-sb-blue" />
                  IPK min {formatGpa(job.minGpa)}
                </span>
              )}
              <span className="flex items-center gap-stack-2xs text-sb-text-2 font-medium">
                <CalendarClock className="w-4 h-4 text-sb-warning" />
                Deadline:{" "}
                <span className="text-sb-navy font-bold">
                  {formatDeadlineDate(job.deadline || job.expiresAt, job.retrievedAt)}
                </span>
              </span>
            </div>
          </div>

          {!isGuest && (
            <div className="shrink-0">
              <ScoreRing status={job.matchStatus} reason={job.matchStatusReason} score={job.matchStatus === "insufficient_evidence" ? null : job.matchScore} size="lg" />
            </div>
          )}
        </div>

        {!isGuest && <MatchBadge status={job.matchStatus} reason={job.matchStatusReason} score={job.matchScore} />}
        {!isGuest && <MatchExplanation status={job.matchStatus} supporting={job.factorsSupporting} limiting={job.factorsLimiting} />}

        <div className="flex flex-wrap items-center gap-stack-sm pt-stack-lg border-t border-sb-border">
          {job.sourceUrl && job.sourceUrl.trim() !== "" ? (
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={async () => {
                if (!isSaved && !isGuest) {
                  await onToggleSave();
                }
              }}
              className="inline-flex"
            >
              <Button
                variant="primary"
                size="md"
                rightIcon={<ExternalLink className="w-4 h-4 ml-stack-2xs" />}
                className="px-stack-xl"
              >
                Lamar di Sumber Asli
              </Button>
            </a>
          ) : null}

          <Button
            variant="outline"
            size="md"
            onClick={onToggleSave}
            leftIcon={
              <Bookmark className={cn("w-4 h-4", isSaved ? "fill-sb-blue text-sb-blue" : "text-sb-text-2")} />
            }
            className="px-stack-lg"
          >
            {isSaved ? "Tersimpan" : "Simpan Lowongan"}
          </Button>

          {!isGuest && (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenChat}
              leftIcon={<MessageSquare className="w-4 h-4" />}
              className="px-stack-lg"
            >
              Tanya Asisten AI
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
