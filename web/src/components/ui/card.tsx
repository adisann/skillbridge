import React from "react";
import { Building2, MapPin, Briefcase, ExternalLink, Bookmark } from "lucide-react";
import { cn, formatJobTitle } from "@/lib/utils";
import { MatchBadge, MatchStatus } from "./badge";
import { ScoreRing } from "./score-ring";
import { SalaryText } from "./salary-text";
import { Button } from "./button";
import { SkillMatchSummary } from "./skill-match-summary";
import { MatchExplanation } from "./match-explanation";
import type { MatchStatusReason, RequirementEvaluation } from "@/lib/matching";

// -----------------------------------------------------------------------------
// Base Card Components (Glassmorphism as Default)
// -----------------------------------------------------------------------------
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid";
  hoverEffect?: boolean;
}

export function Card({
  className,
  variant = "glass",
  hoverEffect = true,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] transition-ui duration-200",
        variant === "glass"
          ? "glass"
          : "border border-sb-border bg-white shadow-xs",
        hoverEffect && "lift-card",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col space-y-stack-2xs p-stack-lg sm:p-stack-xl pb-stack-sm sm:pb-stack-sm", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base font-bold text-sb-navy tracking-tight",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-sb-text-2 leading-relaxed", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-content" className={cn("p-stack-lg sm:p-stack-xl", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center p-stack-lg sm:p-stack-xl pt-stack-sm sm:pt-stack-sm border-t border-sb-border", className)}
      {...props}
    />
  );
}

// -----------------------------------------------------------------------------
// Metric Card (Untuk Angka Statistik & Indikator Pasar)
// -----------------------------------------------------------------------------
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  badge,
  icon,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "p-stack-lg rounded-[20px] glass lift-card flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-center justify-between gap-stack-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-sb-text-2">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-sb-mist-soft text-sb-navy flex items-center justify-center shrink-0 border border-sb-border">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-stack-sm">
        <div className="flex flex-wrap items-baseline gap-stack-xs">
          <span className="text-2xl sm:text-3xl font-extrabold text-sb-navy tracking-tight font-mono-metric">
            {value}
          </span>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-stack-2xs text-xs text-sb-text-2 leading-normal">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// JobCard (Glassmorphic Job Card with ScoreRing Option)
// -----------------------------------------------------------------------------
interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  seniority?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryPeriod?: string | null;
  sourceName?: string;
  sourceUrl: string;
  matchStatus?: MatchStatus;
  matchStatusReason?: MatchStatusReason | null;
  matchScore?: number | null;
  matchedSkills?: string[];
  missingSkills?: string[];
  requirementsEvaluation?: RequirementEvaluation[];
  factorsSupporting?: string[];
  factorsLimiting?: string[];
  requiredSkills?: string[];
  mode?: "guest" | "user";
  isSaved?: boolean;
  isSelected?: boolean;
  onSaveToggle?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function JobCard({
  title,
  company,
  location,
  employmentType,
  seniority,
  salaryMin,
  salaryMax,
  salaryPeriod,
  sourceUrl,
  matchStatus = "insufficient_evidence",
  matchStatusReason,
  matchScore,
  matchedSkills = [],
  missingSkills = [],
  requirementsEvaluation,
  factorsSupporting,
  factorsLimiting,
  requiredSkills = [],
  mode = "user",
  isSaved = false,
  isSelected = false,
  onSaveToggle,
  onViewDetails,
  className,
}: JobCardProps) {
  const isGuest = mode === "guest";
  const formattedTitle = formatJobTitle(title);

  return (
    <Card
      className={cn(
        "overflow-hidden flex flex-col justify-between h-full transition-ui duration-200",
        isSelected && "ring-2 ring-sb-blue border-sb-blue bg-white/90 shadow-md",
        className
      )}
    >
      <CardHeader className="p-stack-lg pb-stack-sm space-y-stack-sm">
        {/* Top Meta Bar: Company + Seniority & Bookmark */}
        <div className="flex items-center justify-between gap-stack-xs">
          <div className="flex flex-wrap items-center gap-stack-2xs min-w-0 flex-1">
            <span
              className="inline-flex items-center text-xs font-semibold text-sb-navy bg-white/80 border border-sb-border px-stack-xs py-stack-3xs rounded-full max-w-[200px] sm:max-w-[260px] truncate"
              title={company}
            >
              <Building2 className="w-3 h-3 mr-stack-2xs text-sb-blue shrink-0" />
              <span className="truncate">{company}</span>
            </span>
            {seniority && (
              <span className="text-[11px] font-medium text-sb-text-2 bg-sb-mist-faint border border-sb-border px-stack-xs py-stack-3xs rounded-full shrink-0">
                {seniority}
              </span>
            )}
          </div>

          <div className="flex items-center gap-stack-2xs shrink-0">
            {onSaveToggle && (
              <button
                type="button"
                onClick={onSaveToggle}
                className={cn(
                  "p-stack-xs rounded-full border transition-colors cursor-pointer",
                  isSaved
                    ? "bg-sb-mist-soft text-sb-blue border-sb-border"
                    : "text-sb-text-2 hover:text-sb-blue hover:bg-white/80 border-sb-border"
                )}
                aria-label={isSaved ? "Hapus dari simpanan" : "Simpan lowongan"}
                title={isSaved ? "Tersimpan" : "Simpan lowongan"}
              >
                <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
              </button>
            )}
          </div>
        </div>

        {/* Title & Score Gauge Row */}
        <div className="flex items-start justify-between gap-stack-sm">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-sb-navy tracking-tight line-clamp-2 leading-snug">
              {onViewDetails ? (
                <button
                  type="button"
                  onClick={onViewDetails}
                  className="text-left font-extrabold text-sb-navy hover:text-sb-blue transition-colors cursor-pointer w-full focus:outline-none focus:underline"
                  title={formattedTitle}
                >
                  {formattedTitle}
                </button>
              ) : (
                <span title={formattedTitle}>{formattedTitle}</span>
              )}
            </h3>
            <div className="flex flex-wrap items-center gap-stack-sm text-xs text-sb-text-2 pt-stack-2xs">
              <span className="flex items-center gap-stack-2xs">
                <MapPin className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                <span>{location}</span>
              </span>
              <span className="flex items-center gap-stack-2xs">
                <Briefcase className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                <span>{employmentType}</span>
              </span>
              <SalaryText salaryMin={salaryMin} salaryMax={salaryMax} salaryPeriod={salaryPeriod} />
            </div>
          </div>

          {!isGuest && (
            <div className="shrink-0 self-start">
              <ScoreRing
                status={matchStatus}
                reason={matchStatusReason}
                score={matchStatus === "insufficient_evidence" ? null : matchScore}
                size="sm"
                showLabel={false}
              />
            </div>
          )}
        </div>

        {/* Status Badge (Hanya mode user) */}
        {!isGuest && (
          <div className="space-y-stack-2xs">
            <MatchBadge status={matchStatus} reason={matchStatusReason} score={matchScore} size="sm" />
            <MatchExplanation status={matchStatus} supporting={factorsSupporting} limiting={factorsLimiting} />
          </div>
        )}
      </CardHeader>

      <CardContent className="px-stack-lg py-stack-sm flex-1">
        {isGuest ? (
          /* Mode Tamu: Tampilkan 3-4 chip skill yang diminta */
          <div className="space-y-stack-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sb-text-2">
              Skill yang diminta:
            </span>
            <div className="flex flex-wrap items-center gap-stack-2xs">
              {(requiredSkills && requiredSkills.length > 0
                ? requiredSkills.slice(0, 4)
                : ["Kualifikasi di deskripsi"]
              ).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-stack-xs py-stack-3xs rounded-full bg-sb-mist-soft text-sb-navy border border-sb-border font-medium text-[11px]"
                >
                  {s}
                </span>
              ))}
              {requiredSkills && requiredSkills.length > 4 && (
                <span className="text-[11px] font-medium text-sb-text-2">
                  +{requiredSkills.length - 4} lainnya
                </span>
              )}
            </div>
          </div>
        ) : (
          <SkillMatchSummary evaluations={requirementsEvaluation} matchedSkills={matchedSkills} missingSkills={missingSkills} />
        )}
      </CardContent>

      <CardFooter className="px-stack-lg py-stack-sm justify-between items-center bg-white/60 border-t border-sb-border rounded-b-[20px] gap-stack-xs mt-auto">
        {sourceUrl && sourceUrl.trim() !== "" ? (
          <div className="min-w-0">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-stack-2xs text-xs font-bold text-sb-navy hover:text-sb-blue underline underline-offset-3 decoration-sb-sky"
            >
              <span>Sumber Asli</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        ) : null}

        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="shrink-0 text-xs whitespace-nowrap px-stack-sm ml-auto"
          >
            Detail
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
