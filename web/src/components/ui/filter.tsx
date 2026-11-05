import React, { useState } from "react";
import { Filter, RotateCcw, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  role: string;
  workType: string;
  seniority: string;
  location?: string;
  postedDate?: string;
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
  { label: "Software Engineer", value: "Software Engineer" },
  { label: "Frontend Developer", value: "Frontend Developer" },
  { label: "Backend Developer", value: "Backend Developer" },
  { label: "Product Manager", value: "Product Manager" },
  { label: "UI/UX Designer", value: "UI/UX Designer" },
  { label: "Digital Marketing", value: "Marketing" },
  { label: "Keuangan / Finansial", value: "Finance" },
  { label: "Operasional Bisnis", value: "Operations" },
  { label: "Cyber Security", value: "Cyber Security" },
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

export const LOCATION_OPTIONS = [
  { label: "Semua Lokasi", value: "all" },
  { label: "Jakarta / Jabodetabek", value: "jakarta" },
  { label: "Bandung", value: "bandung" },
  { label: "Surabaya", value: "surabaya" },
  { label: "Yogyakarta", value: "yogyakarta" },
  { label: "Bali", value: "bali" },
  { label: "Remote / Fleksibel", value: "remote" },
];

export const DATE_OPTIONS = [
  { label: "Semua Waktu", value: "all" },
  { label: "7 Hari Terakhir", value: "7d" },
  { label: "14 Hari Terakhir", value: "14d" },
  { label: "30 Hari Terakhir", value: "30d" },
];

export function FilterBar({
  filters,
  onChange,
  onReset,
  className,
}: FilterBarProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const activeFilterList: Array<{ key: keyof FilterState; label: string; valueLabel: string }> = [];
  if (filters.role && filters.role !== "all") {
    activeFilterList.push({
      key: "role",
      label: "Role",
      valueLabel: ROLE_OPTIONS.find((o) => o.value === filters.role)?.label || filters.role,
    });
  }
  if (filters.location && filters.location !== "all") {
    activeFilterList.push({
      key: "location",
      label: "Lokasi",
      valueLabel: LOCATION_OPTIONS.find((o) => o.value === filters.location)?.label || filters.location,
    });
  }
  if (filters.workType && filters.workType !== "all") {
    activeFilterList.push({
      key: "workType",
      label: "Tipe",
      valueLabel: WORK_TYPE_OPTIONS.find((o) => o.value === filters.workType)?.label || filters.workType,
    });
  }
  if (filters.seniority && filters.seniority !== "all") {
    activeFilterList.push({
      key: "seniority",
      label: "Level",
      valueLabel: SENIORITY_OPTIONS.find((o) => o.value === filters.seniority)?.label || filters.seniority,
    });
  }
  if (filters.postedDate && filters.postedDate !== "all") {
    activeFilterList.push({
      key: "postedDate",
      label: "Waktu",
      valueLabel: DATE_OPTIONS.find((o) => o.value === filters.postedDate)?.label || filters.postedDate,
    });
  }

  const isFiltered = activeFilterList.length > 0;

  const updateField = (field: keyof FilterState, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  const removeFilter = (field: keyof FilterState) => {
    onChange({ ...filters, [field]: "all" });
  };

  return (
    <>
      {/* ----------------------------------------------------------------- */}
      {/* Mobile Compact Bar & Active Filter Chips                          */}
      {/* ----------------------------------------------------------------- */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white shadow-2xs text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter</span>
            {activeFilterList.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterList.length}
              </span>
            )}
          </button>

          {isFiltered && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Active Filter Chips Scrollable */}
        {activeFilterList.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            {activeFilterList.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold shrink-0"
              >
                <span>{chip.valueLabel}</span>
                <button
                  type="button"
                  onClick={() => removeFilter(chip.key)}
                  className="hover:bg-blue-200/60 rounded-full p-0.5 text-blue-600 cursor-pointer"
                  aria-label={`Hapus filter ${chip.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Mobile Filter Bottom Sheet / Modal Drawer                         */}
      {/* ----------------------------------------------------------------- */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Sheet container */}
          <div className="relative bg-white rounded-t-3xl border-t border-slate-200 p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Filter Lowongan</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Role */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Peran Target
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => updateField("role", e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Lokasi Kerja
                </label>
                <select
                  value={filters.location || "all"}
                  onChange={(e) => updateField("location", e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LOCATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Tipe Kerja
                </label>
                <select
                  value={filters.workType}
                  onChange={(e) => updateField("workType", e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {WORK_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seniority */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Senioritas
                </label>
                <select
                  value={filters.seniority}
                  onChange={(e) => updateField("seniority", e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SENIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Posted Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Waktu Tayang
                </label>
                <select
                  value={filters.postedDate || "all"}
                  onChange={(e) => updateField("postedDate", e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DATE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 flex items-center gap-2">
              {isFiltered && onReset && (
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setIsMobileDrawerOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Desktop Filter Bar (Visible on md and above)                       */}
      {/* ----------------------------------------------------------------- */}
      <div
        className={cn(
          "hidden md:block p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3.5",
          className
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-600" />
            Filter Lowongan & Pasar
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Role Filter */}
          <div className="space-y-1">
            <label htmlFor="filter-role" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Peran Target
            </label>
            <select
              id="filter-role"
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

          {/* Location Filter */}
          <div className="space-y-1">
            <label htmlFor="filter-location" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Lokasi Kerja
            </label>
            <select
              id="filter-location"
              value={filters.location || "all"}
              onChange={(e) => updateField("location", e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {LOCATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Work Type Filter */}
          <div className="space-y-1">
            <label htmlFor="filter-work-type" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Tipe Kerja
            </label>
            <select
              id="filter-work-type"
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
            <label htmlFor="filter-seniority" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Senioritas
            </label>
            <select
              id="filter-seniority"
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

          {/* Posted Date Filter */}
          <div className="space-y-1">
            <label htmlFor="filter-posted-date" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Waktu Tayang
            </label>
            <select
              id="filter-posted-date"
              value={filters.postedDate || "all"}
              onChange={(e) => updateField("postedDate", e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {DATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}

