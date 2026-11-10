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

const SOURCE_LABEL: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  linkedin: "LinkedIn",
  jobstreet: "JobStreet",
  glints: "Glints",
  admin_import: "Diimpor admin",
};

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
      <CardContent className="p-6 sm:p-8 space-y-6">
        {job.isDemo && (
          <p role="note" className="mb-4 rounded-xl border border-sb-warning/40 bg-sb-warning/10 px-4 py-3 text-sm text-sb-navy">
            <strong>Lowongan contoh.</strong> {DEMO_JOB_NOTICE}
          </p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-sb-mist-soft text-sb-navy border border-sb-border text-xs font-bold">
              {categoryLabel}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-sb-navy tracking-tight">
              {formatJobTitle(job.title)}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-sb-text-2 pt-1">
              <span className="flex items-center gap-1.5 font-bold text-sb-navy">
                <Building2 className="w-4 h-4 text-sb-blue" />
                {job.company}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sb-blue" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-sb-blue" />
                Tipe: {job.employmentType}
              </span>
              <SalaryText
                salaryMin={job.salaryMin}
                salaryMax={job.salaryMax}
                salaryPeriod={job.salaryPeriod}
                className="gap-1.5"
                iconClassName="w-4 h-4"
              />
              {job.minGpa != null && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-sb-blue" />
                  IPK min {formatGpa(job.minGpa)}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sb-text-2 font-medium">
                <CalendarClock className="w-4 h-4 text-sb-warning" />
                Deadline:{" "}
                <span className="text-sb-navy font-bold">
                  {formatDeadlineDate(job.deadline || job.expiresAt, job.retrievedAt)}
                </span>
              </span>
            </div>
          </div>

          {!isGuest && (
            <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
              <ScoreRing score={job.matchStatus === "insufficient_evidence" ? null : job.matchScore} size="lg" />
              <MatchBadge status={job.matchStatus} score={job.matchScore} />
            </div>
          )}
        </div>

        {!job.isDemo && (job.sourceName || job.retrievedAt) && (
          <p className="pt-4 text-xs text-sb-text-2">
            Sumber: <span className="font-semibold text-sb-navy">{SOURCE_LABEL[job.sourceName] ?? job.sourceName}</span>
            {job.retrievedAt && !Number.isNaN(Date.parse(job.retrievedAt)) && (
              <> · Diambil {new Date(job.retrievedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</>
            )}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-sb-border">
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
                rightIcon={<ExternalLink className="w-4 h-4 ml-1" />}
                className="px-6"
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
            className="px-5"
          >
            {isSaved ? "Tersimpan" : "Simpan Lowongan"}
          </Button>

          {!isGuest && (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenChat}
              leftIcon={<MessageSquare className="w-4 h-4" />}
              className="px-5"
            >
              Tanya Asisten AI
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
