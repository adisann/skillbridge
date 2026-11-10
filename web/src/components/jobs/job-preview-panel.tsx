import type { RefObject } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Briefcase,
  ExternalLink,
  Bookmark,
  ArrowRight,
  CheckCircle2,
  XCircle,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { SkillChips } from "@/components/ui/skill-chips";
import { MatchBadge } from "@/components/ui/badge";
import { cn, formatJobTitle } from "@/lib/utils";
import { getCategoryFromTitle, getCategoryBySlug } from "@/lib/job-categories";
import type { JobListItem } from "@/types/job";
import { SalaryText } from "@/components/ui/salary-text";
import { formatGpa } from "@/lib/gpa";

interface JobPreviewPanelProps {
  job: JobListItem;
  isGuest: boolean;
  isSaved: boolean;
  detailRoutePrefix: string;
  panelRef: RefObject<HTMLDivElement | null>;
  onToggleSave: () => void;
}

function PreviewHeader({
  job,
  isGuest,
  isSaved,
  detailRoutePrefix,
  onToggleSave,
}: Omit<JobPreviewPanelProps, "panelRef">) {
  const categoryLabel =
    job.categoryLabel ||
    getCategoryBySlug(job.category)?.label ||
    getCategoryFromTitle(job.title, job.canonicalTitle).label;

  return (
    <div className="sticky top-0 z-20 bg-[var(--sb-glass-bg-strong)] backdrop-blur-md p-5 sm:p-6 pb-4 border-b border-sb-border rounded-t-[24px] space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sb-navy bg-sb-mist-soft px-2.5 py-0.5 rounded-full border border-sb-border">
              {categoryLabel}
            </span>
            {job.seniority && (
              <span className="text-xs font-semibold text-sb-text-2 bg-sb-mist-faint px-2 py-0.5 rounded-full border border-sb-border">
                {job.seniority}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-sb-navy tracking-tight leading-snug line-clamp-2">
            {formatJobTitle(job.title)}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-sb-text-2 pt-0.5">
            <span className="flex items-center gap-1.5 text-sb-navy">
              <Building2 className="w-3.5 h-3.5 text-sb-blue shrink-0" />
              <span className="truncate max-w-[170px]">{job.company}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sb-blue shrink-0" />
              <span className="truncate max-w-[140px]">{job.location}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-sb-blue shrink-0" />
              <span>{job.employmentType}</span>
            </span>
            <SalaryText salaryMin={job.salaryMin} salaryMax={job.salaryMax} salaryPeriod={job.salaryPeriod} className="gap-1.5" />
            {job.minGpa != null && (
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                <span>IPK min {formatGpa(job.minGpa)}</span>
              </span>
            )}
          </div>
        </div>

        {!isGuest && (
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <ScoreRing
              score={job.matchStatus === "insufficient_evidence" ? null : job.matchScore}
              size="md"
              showLabel={false}
            />
            <MatchBadge status={job.matchStatus} score={job.matchScore} size="sm" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {job.sourceUrl && (
          <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ExternalLink className="w-3.5 h-3.5 ml-1" />}
              className="px-4 text-xs font-bold whitespace-nowrap"
            >
              Lamar di Sumber Asli
            </Button>
          </a>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSave}
          leftIcon={<Bookmark className={cn("w-3.5 h-3.5 shrink-0", isSaved && "fill-sb-blue text-sb-blue")} />}
          className="px-3.5 text-xs font-semibold shrink-0 whitespace-nowrap"
        >
          {isSaved ? "Tersimpan" : "Simpan Lowongan"}
        </Button>
        <Link href={`${detailRoutePrefix}/${job.id}`} className="shrink-0">
          <Button
            variant="secondary"
            size="sm"
            className="px-3.5 text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5"
          >
            Buka Detail <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function GuestLoginCard({
  jobId,
  detailRoutePrefix,
}: {
  jobId: string;
  detailRoutePrefix: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-sb-mist-soft border border-sb-border space-y-3">
      <h3 className="text-sm font-bold text-sb-navy">Masuk untuk melihat skill mana yang sudah ada di CV-mu</h3>
      <p className="text-xs text-sb-text-2 leading-relaxed">
        Masuk dan unggah CV untuk membandingkan kualifikasi secara otomatis dengan lowongan ini.
      </p>
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <Link href={`/login?next=${encodeURIComponent(`${detailRoutePrefix}/${jobId}`)}`}>
          <Button variant="primary" size="sm">
            Masuk
          </Button>
        </Link>
      </div>
    </div>
  );
}

/** Mode tamu: skill wajib dan tambahan sebagai chip netral. */
function GuestRequirements({ job }: { job: JobListItem }) {
  return (
    <div className="space-y-3">
      {job.requiredSkills && job.requiredSkills.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-sb-navy">Skill Wajib:</span>
          <SkillChips
            skills={job.requiredSkills}
            gapClass="gap-1.5"
            chipClass="bg-sb-mist-soft text-sb-navy border-sb-border"
          />
        </div>
      )}
      {job.preferredSkills && job.preferredSkills.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-bold text-sb-text-2">Skill Tambahan:</span>
          <SkillChips
            skills={job.preferredSkills}
            gapClass="gap-1.5"
            chipClass="bg-sb-mist-faint text-sb-navy border-sb-border"
          />
        </div>
      )}
    </div>
  );
}

/** Mode pengguna: skill yang cocok dan yang belum ditemukan di CV. */
function UserRequirements({ job }: { job: JobListItem }) {
  return (
    <div className="space-y-3">
      {job.matchedSkills.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sb-good">
            <CheckCircle2 className="w-4 h-4 text-sb-good" />
            <span>Keahlian yang cocok di CV ({job.matchedSkills.length})</span>
          </div>
          <SkillChips
            skills={job.matchedSkills}
            gapClass="gap-2"
            chipClass="bg-emerald-50 text-sb-good border-emerald-200"
          />
        </div>
      )}

      {job.missingSkills.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sb-critical">
            <XCircle className="w-4 h-4 text-sb-critical" />
            <span>Keahlian belum ditemukan di CV ({job.missingSkills.length})</span>
          </div>
          <SkillChips
            skills={job.missingSkills}
            gapClass="gap-2"
            chipClass="bg-sb-mist-faint text-sb-text-2 border-sb-border"
          />
        </div>
      )}
    </div>
  );
}

/** Pratinjau lowongan di kolom kanan Job Explorer (desktop, sticky). */
export function JobPreviewPanel({
  job,
  isGuest,
  isSaved,
  detailRoutePrefix,
  panelRef,
  onToggleSave,
}: JobPreviewPanelProps) {
  return (
    <div className={cn("hidden lg:block lg:col-span-6 xl:col-span-7 sticky self-start", isGuest ? "top-[88px]" : "top-6")}>
      <div
        ref={panelRef}
        className={cn(
          "glass-panel rounded-[24px] shadow-md overflow-y-auto overscroll-contain sb-panel-scroll",
          isGuest ? "max-h-[calc(100svh-112px)]" : "max-h-[calc(100svh-48px)]"
        )}
      >
        <PreviewHeader
          job={job}
          isGuest={isGuest}
          isSaved={isSaved}
          detailRoutePrefix={detailRoutePrefix}
          onToggleSave={onToggleSave}
        />

        <div className="p-5 sm:p-6 pt-5 pb-24 sm:pb-28 space-y-5">
          {isGuest && <GuestLoginCard jobId={job.id} detailRoutePrefix={detailRoutePrefix} />}

          <div className="space-y-4 pt-1">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-sb-navy">Persyaratan Kualifikasi</h3>
            {isGuest ? <GuestRequirements job={job} /> : <UserRequirements job={job} />}
          </div>
        </div>
      </div>
    </div>
  );
}
