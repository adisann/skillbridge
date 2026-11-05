import React from "react";
import { Building2, MapPin, Briefcase, ExternalLink, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { MatchBadge, MatchStatus } from "./badge";
import { Button } from "./button";

// -----------------------------------------------------------------------------
// Base Card Components
// -----------------------------------------------------------------------------
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all",
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
      className={cn("flex flex-col space-y-1.5 p-5 pb-3", className)}
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
        "text-base font-bold text-slate-900 tracking-tight",
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
    <p className={cn("text-xs text-slate-500 leading-relaxed", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center p-5 pt-3 border-t border-slate-100", className)}
      {...props}
    />
  );
}

// -----------------------------------------------------------------------------
// Metric Card (Untuk Angka Statistik & Indikator Pasar)
// -----------------------------------------------------------------------------
export interface MetricCardProps {
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
        "p-5 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </span>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 leading-normal">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// JobCard (FR-03, FR-05, FR-06)
// Menampilkan judul, perusahaan, lokasi, level, sumber asli, status kecocokan
// -----------------------------------------------------------------------------
export interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  seniority?: string;
  sourceName: string;
  sourceUrl: string;
  matchStatus: MatchStatus;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  isSaved?: boolean;
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
  sourceName,
  sourceUrl,
  matchStatus,
  matchScore,
  matchedSkills,
  missingSkills,
  isSaved = false,
  onSaveToggle,
  onViewDetails,
  className,
}: JobCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-all duration-200 border-slate-200", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                <Building2 className="w-3 h-3 mr-1 text-slate-400" />
                {company}
              </span>
              {seniority && (
                <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                  {seniority}
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-mono">
                Sumber: {sourceName}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight hover:text-blue-600 transition-colors">
              {title}
            </h4>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {employmentType}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <MatchBadge status={matchStatus} score={matchScore} />
            {onSaveToggle && (
              <button
                type="button"
                onClick={onSaveToggle}
                className={cn(
                  "p-1.5 rounded-lg border transition-colors",
                  isSaved
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-transparent"
                )}
                aria-label={isSaved ? "Hapus dari simpanan" : "Simpan lowongan"}
              >
                <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Breakdown Singkat Kecocokan */}
        <div className="mt-2 space-y-2 text-xs">
          {matchedSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-emerald-800 text-[11px]">
                Cocok:
              </span>
              {matchedSkills.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium"
                >
                  ✓ {s}
                </span>
              ))}
            </div>
          )}

          {missingSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-600 text-[11px]">
                Belum ditemukan:
              </span>
              {missingSkills.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="justify-between bg-slate-50/60 rounded-b-xl gap-2">
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Lihat Lowongan Asli
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {onViewDetails && (
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            Detail Match & Gap
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

