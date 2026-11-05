import React from "react";
import { Building2, MapPin, Briefcase, ExternalLink, Bookmark, Check } from "lucide-react";
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
        "rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-colors duration-150",
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
        "p-5 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-blue-200 transition-colors duration-150 flex flex-col justify-between",
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
// JobCard
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
  matchScore?: number | null;
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
    <Card
      className={cn(
        "overflow-hidden flex flex-col justify-between h-full hover:shadow-md hover:border-slate-300 transition-[border-color,box-shadow] duration-200 border-slate-200 bg-white",
        className
      )}
    >
      <CardHeader className="p-5 pb-3 space-y-3">
        {/* Top Meta Bar: Company + Seniority & Bookmark */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
            <span
              className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md max-w-[200px] sm:max-w-[260px] truncate"
              title={company}
            >
              <Building2 className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
              <span className="truncate">{company}</span>
            </span>
            {seniority && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
                {seniority}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
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
                title={isSaved ? "Tersimpan" : "Simpan lowongan"}
              >
                <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
              </button>
            )}
          </div>
        </div>

        {/* Title & Match Badge Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold text-slate-900 tracking-tight line-clamp-2 leading-snug">
              {onViewDetails ? (
                <button
                  type="button"
                  onClick={onViewDetails}
                  className="text-left font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer w-full focus:outline-none focus:underline"
                  title={title}
                >
                  {title}
                </button>
              ) : (
                <span title={title}>{title}</span>
              )}
            </h4>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{location}</span>
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{employmentType}</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-auto pt-0.5 sm:pt-0">
            <MatchBadge status={matchStatus} score={matchScore} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-3 flex-1">
        {/* Breakdown Singkat Kecocokan */}
        <div className="space-y-2.5 text-xs">
          {matchedSkills.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Cocok:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {matchedSkills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium text-[11px]"
                  >
                    <Check className="w-3 h-3 text-emerald-600 mr-1 shrink-0 stroke-[2.5]" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {missingSkills.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Belum ditemukan:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {missingSkills.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 font-medium text-[11px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-5 py-3.5 justify-between items-center bg-slate-50/70 border-t border-slate-100 rounded-b-xl gap-2 mt-auto">
        <div className="min-w-0">
          {sourceUrl && sourceUrl.trim() !== "" ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              <span>Lihat Sumber Asli</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          ) : (
            <span className="text-xs text-slate-400">
              Rincian kontak di deskripsi
            </span>
          )}
        </div>

        {onViewDetails && (
          <Button variant="outline" size="sm" onClick={onViewDetails} className="shrink-0">
            Detail Lowongan
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

