import { useEffect, useId, useState, type RefObject } from "react";
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
import { fetchDeduped } from "@/lib/fetcher";
import { formatJobDescription } from "@/lib/job-detail";
import { SkeletonText } from "@/components/ui/loading";

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
    <div className="sticky top-0 z-20 bg-white p-stack-lg sm:p-stack-xl pb-stack-md border-b border-sb-border rounded-t-[24px] space-y-stack-sm">
      <div className="flex items-start justify-between gap-stack-sm">
        <div className="space-y-stack-2xs min-w-0 flex-1">
          <div className="flex items-center gap-stack-xs">
            <span className="text-xs font-bold text-sb-navy bg-sb-mist-soft px-stack-xs py-stack-3xs rounded-full border border-sb-border">
              {categoryLabel}
            </span>
            {job.seniority && (
              <span className="text-xs font-semibold text-sb-text-2 bg-sb-mist-faint px-stack-xs py-stack-3xs rounded-full border border-sb-border">
                {job.seniority}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-sb-navy tracking-tight leading-snug line-clamp-2">
            {formatJobTitle(job.title)}
          </h2>
          <div className="flex flex-wrap items-center gap-stack-sm text-xs font-semibold text-sb-text-2 pt-stack-3xs">
            <span className="flex items-center gap-stack-2xs text-sb-navy">
              <Building2 className="w-3.5 h-3.5 text-sb-blue shrink-0" />
              <span className="truncate max-w-[170px]">{job.company}</span>
            </span>
            <span className="flex items-center gap-stack-2xs">
              <MapPin className="w-3.5 h-3.5 text-sb-blue shrink-0" />
              <span className="truncate max-w-[140px]">{job.location}</span>
            </span>
            <span className="flex items-center gap-stack-2xs">
              <Briefcase className="w-3.5 h-3.5 text-sb-blue shrink-0" />
              <span>{job.employmentType}</span>
            </span>
            <SalaryText salaryMin={job.salaryMin} salaryMax={job.salaryMax} salaryPeriod={job.salaryPeriod} className="gap-stack-2xs" />
            {job.minGpa != null && (
              <span className="flex items-center gap-stack-2xs">
                <GraduationCap className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                <span>IPK min {formatGpa(job.minGpa)}</span>
              </span>
            )}
          </div>
        </div>

        {!isGuest && (
          <div className="shrink-0">
            <ScoreRing
              status={job.matchStatus}
              score={job.matchStatus === "insufficient_evidence" ? null : job.matchScore}
              size="md"
              showLabel={false}
            />
          </div>
        )}
      </div>

      {!isGuest && <MatchBadge status={job.matchStatus} score={job.matchScore} size="sm" />}

      <div className="flex flex-wrap items-center gap-stack-xs pt-stack-2xs">
        {job.sourceUrl && (
          <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ExternalLink className="w-3.5 h-3.5 ml-stack-2xs" />}
              className="px-stack-md text-xs font-bold whitespace-nowrap"
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
          className="px-stack-sm text-xs font-semibold shrink-0 whitespace-nowrap"
        >
          {isSaved ? "Tersimpan" : "Simpan Lowongan"}
        </Button>
        <Link href={`${detailRoutePrefix}/${job.id}`} className="shrink-0">
          <Button
            variant="secondary"
            size="sm"
            className="px-stack-sm text-xs font-semibold whitespace-nowrap inline-flex items-center gap-stack-2xs"
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
    <div className="p-stack-lg rounded-2xl bg-sb-mist-soft border border-sb-border space-y-stack-sm">
      <h3 className="text-sm font-bold text-sb-navy">Masuk untuk melihat skill mana yang sudah ada di CV-mu</h3>
      <p className="text-xs text-sb-text-2 leading-relaxed">
        Masuk dan unggah CV untuk membandingkan kualifikasi secara otomatis dengan lowongan ini.
      </p>
      <div className="flex flex-wrap items-center gap-stack-xs pt-stack-2xs">
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
    <div className="space-y-stack-sm">
      {job.requiredSkills && job.requiredSkills.length > 0 && (
        <div className="space-y-stack-2xs">
          <span className="text-xs font-bold text-sb-navy">Skill Wajib:</span>
          <SkillChips
            skills={job.requiredSkills}
            gapClass="gap-stack-2xs"
            chipClass="bg-sb-mist-soft text-sb-navy border-sb-border"
          />
        </div>
      )}
      {job.preferredSkills && job.preferredSkills.length > 0 && (
        <div className="space-y-stack-2xs pt-stack-2xs">
          <span className="text-xs font-bold text-sb-text-2">Skill Tambahan:</span>
          <SkillChips
            skills={job.preferredSkills}
            gapClass="gap-stack-2xs"
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
    <div className="space-y-stack-sm">
      {job.matchedSkills.length > 0 && (
        <div className="space-y-stack-xs">
          <div className="flex items-center gap-stack-2xs text-xs font-bold text-sb-good">
            <CheckCircle2 className="w-4 h-4 text-sb-good" />
            <span>Keahlian yang cocok di CV ({job.matchedSkills.length})</span>
          </div>
          <SkillChips
            skills={job.matchedSkills}
            gapClass="gap-stack-xs"
            chipClass="bg-emerald-50 text-sb-good border-emerald-200"
          />
        </div>
      )}

      {job.missingSkills.length > 0 && (
        <div className="space-y-stack-xs pt-stack-xs">
          <div className="flex items-center gap-stack-2xs text-xs font-bold text-sb-critical">
            <XCircle className="w-4 h-4 text-sb-critical" />
            <span>Keahlian belum ditemukan di CV ({job.missingSkills.length})</span>
          </div>
          <SkillChips
            skills={job.missingSkills}
            gapClass="gap-stack-xs"
            chipClass="bg-sb-mist-faint text-sb-text-2 border-sb-border"
          />
        </div>
      )}
    </div>
  );
}

function PreviewDescription({ jobId }: { jobId: string }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const previewLength = 400;

  useEffect(() => {
    let live = true;
    fetchDeduped<{ job: { description: string } }>(`/api/jobs/${encodeURIComponent(jobId)}`)
      .then((data) => { if (live) setDescription(formatJobDescription(data.job.description || "")); })
      .catch(() => { if (live) setError(true); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [jobId]);

  const isLong = description.length > previewLength;
  return (
    <section aria-labelledby={`${id}-heading`} className="space-y-stack-sm">
      <h3 id={`${id}-heading`} className="text-sm font-bold text-sb-navy">Deskripsi pekerjaan</h3>
      {loading ? <SkeletonText lines={4} /> : (
        <>
          <p id={id} className="text-sm leading-relaxed text-sb-text-2 whitespace-pre-line [overflow-wrap:anywhere]">
            {error ? "Deskripsi belum dapat dimuat. Buka detail lowongan untuk mencoba lagi." : !description ? "Deskripsi pekerjaan belum tersedia dari sumber lowongan." : expanded || !isLong ? description : `${description.slice(0, previewLength).trimEnd()}…`}
          </p>
          {isLong && (
            <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((value) => !value)}
              className="rounded-lg py-stack-2xs text-xs font-semibold text-sb-blue underline underline-offset-2 hover:text-sb-blue-hover focus-visible:outline-2 focus-visible:outline-sb-blue">
              {expanded ? "Tampilkan lebih sedikit" : "Tampilkan lebih banyak"}
            </button>
          )}
        </>
      )}
    </section>
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
    <div className={cn("hidden lg:block lg:col-span-6 xl:col-span-7 sticky self-start", isGuest ? "top-[88px]" : "top-stack-xl")}>
      <div
        ref={panelRef}
        role="region"
        aria-label={`Pratinjau lowongan ${job.title}`}
        tabIndex={0}
        className={cn(
          "bg-white border border-sb-border rounded-[24px] shadow-md overflow-y-auto overscroll-contain sb-panel-scroll focus-visible:outline-2 focus-visible:outline-sb-blue",
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

        <div className="p-stack-lg sm:p-stack-xl space-y-stack-lg">
          {isGuest && <GuestLoginCard jobId={job.id} detailRoutePrefix={detailRoutePrefix} />}
          <div className="space-y-stack-md pt-stack-2xs">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-sb-navy">Persyaratan Kualifikasi</h3>
            {isGuest ? <GuestRequirements job={job} /> : <UserRequirements job={job} />}
          </div>

          <PreviewDescription key={job.id} jobId={job.id} />
        </div>
      </div>
    </div>
  );
}
