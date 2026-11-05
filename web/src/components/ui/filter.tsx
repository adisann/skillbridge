import React from "react";
import { Filter, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  role: string;
  workType: string;
  seniority: string;
}

export interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset?: () => void;
  sampleCount?: number;
  className?: string;
}

export const ROLE_OPTIONS = [
  { label: "Semua Role", value: "all" },
  { label: "Data Analyst", value: "Data Analyst" },
  { label: "BI Analyst", value: "BI Analyst" },
];

export const WORK_TYPE_OPTIONS = [
  { label: "Semua Tipe", value: "all" },
  { label: "Remote", value: "Remote" },
  { label: "Hybrid", value: "Hybrid" },
  { label: "Onsite", value: "Onsite" },
];

export const SENIORITY_OPTIONS = [
  { label: "Semua Level", value: "all" },
  { label: "Junior / Entry", value: "Junior" },
  { label: "Mid-level", value: "Mid" },
  { label: "Senior", value: "Senior" },
  { label: "Lead", value: "Lead" },
];

export function FilterBar({
  filters,
  onChange,
  onReset,
  sampleCount,
  className,
}: FilterBarProps) {
  const isFiltered =
    filters.role !== "all" ||
    filters.workType !== "all" ||
    filters.seniority !== "all";

  const updateField = (field: keyof FilterState, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3.5",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          Filter Lowongan & Pasar
          {sampleCount !== undefined && (
            <span className="text-[11px] font-semibold text-slate-500 normal-case bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Sampel $N$ = {sampleCount}
            </span>
          )}
        </div>

        {isFiltered && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Role Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Peran Target
          </label>
          <select
            value={filters.role}
            onChange={(e) => updateField("role", e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Work Type Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Tipe Kerja
          </label>
          <select
            value={filters.workType}
            onChange={(e) => updateField("workType", e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {WORK_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Seniority Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Senioritas
          </label>
          <select
            value={filters.seniority}
            onChange={(e) => updateField("seniority", e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {SENIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

