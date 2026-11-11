import React, { useState } from "react";
import { Filter, RotateCcw, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildActiveFilters,
  buildBidangOptions,
  buildFilterFields,
  type ActiveFilter,
  type FilterField,
  type FilterState,
} from "@/lib/job-filters";

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset?: () => void;
  categoryCounts?: Record<string, number>;
  sampleCount?: number;
  className?: string;
}

type SelectHandler = (field: keyof FilterState, value: string) => void;

const SELECT_BASE_CLASS =
  "w-full h-10 rounded-xl border border-sb-border px-stack-sm text-xs font-semibold text-sb-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-sb-blue";
const SELECT_SURFACE = { sheet: "bg-white", bar: "bg-white" } as const;
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-wider text-sb-text-2";

interface FilterSelectProps {
  field: FilterField;
  surface: keyof typeof SELECT_SURFACE;
  onSelect: SelectHandler;
  /** Hanya panel desktop yang menautkan label ke select lewat id (sheet mobile tampil bersamaan di DOM). */
  linkLabel?: boolean;
}

function FilterSelect({ field, surface, onSelect, linkLabel = false }: FilterSelectProps) {
  // Label membungkus select (asosiasi implisit), jadi sheet mobile dan panel desktop sama-sama
  // punya nama aksesibel tanpa id ganda di DOM.
  const controlId = linkLabel ? field.id : undefined;
  return (
    <label className="block space-y-stack-2xs">
      <span className={cn("block", LABEL_CLASS)}>{field.label}</span>
      <select
        id={controlId}
        value={field.value}
        onChange={(e) => onSelect(field.key, e.target.value)}
        className={cn(SELECT_BASE_CLASS, SELECT_SURFACE[surface])}
      >
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface FilterToolbarProps {
  activeFilters: ActiveFilter[];
  isOpen: boolean;
  onToggle: () => void;
  onReset?: () => void;
  onRemove: (field: keyof FilterState) => void;
}

/** Tombol Filter (ringkas) + chip filter aktif; panel lengkap hanya muncul saat dibuka. */
function FilterToolbar({ activeFilters, isOpen, onToggle, onReset, onRemove }: FilterToolbarProps) {
  return (
    <div className="space-y-stack-xs">
      <div className="flex items-center justify-between gap-stack-xs">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="inline-flex items-center gap-stack-xs px-stack-md py-stack-xs rounded-full border border-sb-border bg-white shadow-xs text-xs font-bold text-sb-navy hover:bg-white transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-sb-blue" />
          <span>Filter</span>
          {activeFilters.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-sb-sky text-sb-navy text-xs font-bold flex items-center justify-center">
              {activeFilters.length}
            </span>
          )}
          <ChevronDown className={cn("hidden md:block w-3.5 h-3.5 text-sb-text-2 transition-transform", isOpen && "rotate-180")} />
        </button>

        {activeFilters.length > 0 && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-sb-text-2 hover:text-sb-blue flex items-center gap-stack-2xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-stack-2xs overflow-x-auto md:flex-wrap md:overflow-visible pb-stack-2xs pt-stack-3xs no-scrollbar">
          {activeFilters.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-stack-2xs px-stack-sm py-stack-2xs rounded-full bg-sb-mist-soft text-sb-navy border border-sb-border text-[11px] font-semibold shrink-0"
            >
              <span>{chip.valueLabel}</span>
              <button
                type="button"
                onClick={() => onRemove(chip.key)}
                className="hover:bg-sb-mist rounded-full p-stack-3xs text-sb-text-2 cursor-pointer"
                aria-label={`Hapus filter ${chip.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface MobileFilterSheetProps {
  fields: FilterField[];
  isFiltered: boolean;
  onSelect: SelectHandler;
  onReset?: () => void;
  onClose: () => void;
}

function MobileFilterSheet({ fields, isFiltered, onSelect, onReset, onClose }: MobileFilterSheetProps) {
  return (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative bg-white rounded-t-[28px] border-t border-sb-border p-stack-xl shadow-2xl max-h-[85vh] overflow-y-auto space-y-stack-md animate-sheet-in">
        <div className="flex items-center justify-between pb-stack-sm border-b border-sb-border">
          <div className="flex items-center gap-stack-xs">
            <SlidersHorizontal className="w-4 h-4 text-sb-blue" />
            <h3 className="text-sm font-bold text-sb-navy">Filter Lowongan</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-stack-2xs rounded-full text-sb-text-2 hover:text-sb-navy bg-white/70 border border-sb-border cursor-pointer"
            aria-label="Tutup filter"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-stack-sm">
          {fields.map((field) => (
            <FilterSelect key={field.key} field={field} surface="sheet" onSelect={onSelect} />
          ))}
        </div>

        <div className="pt-stack-sm flex items-center gap-stack-xs">
          {isFiltered && onReset && (
            <button
              type="button"
              onClick={() => {
                onReset();
                onClose();
              }}
              className="flex-1 py-stack-sm rounded-full border border-sb-border text-xs font-bold text-sb-navy hover:bg-white/80 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-stack-sm rounded-full bg-sb-blue hover:bg-sb-blue-hover text-white text-xs font-bold transition-ui cursor-pointer shadow-xs"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
}

interface DesktopFilterPanelProps {
  fields: FilterField[];
  isFiltered: boolean;
  onSelect: SelectHandler;
  onReset?: () => void;
  className?: string;
}

function DesktopFilterPanel({ fields, isFiltered, onSelect, onReset, className }: DesktopFilterPanelProps) {
  return (
    <div className={cn("hidden md:block p-stack-lg rounded-[20px] bg-white border border-sb-border shadow-sm space-y-stack-md animate-drop-in", className)}>
      <div className="flex flex-wrap items-center justify-between gap-stack-sm">
        <div className="flex items-center gap-stack-xs text-xs font-bold text-sb-navy uppercase tracking-wider">
          <Filter className="w-4 h-4 text-sb-blue" />
          Filter Lowongan
        </div>

        {isFiltered && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-stack-2xs text-xs font-semibold text-sb-text-2 hover:text-sb-blue transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-sm">
        {fields.map((field) => (
          <FilterSelect key={field.key} field={field} surface="bar" onSelect={onSelect} linkLabel />
        ))}
      </div>
    </div>
  );
}

export function FilterBar({ filters, onChange, onReset, categoryCounts, className }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const fields = buildFilterFields(filters, buildBidangOptions(filters.role, categoryCounts));
  const activeFilters = buildActiveFilters(filters);
  const isFiltered = activeFilters.length > 0;

  const updateField: SelectHandler = (field, value) => onChange({ ...filters, [field]: value });
  const removeFilter = (field: keyof FilterState) => updateField(field, "all");
  const closeDrawer = () => setIsOpen(false);

  return (
    <>
      <FilterToolbar
        activeFilters={activeFilters}
        isOpen={isOpen}
        onToggle={() => setIsOpen((open) => !open)}
        onReset={onReset}
        onRemove={removeFilter}
      />

      {isOpen && (
        <MobileFilterSheet
          fields={fields}
          isFiltered={isFiltered}
          onSelect={updateField}
          onReset={onReset}
          onClose={closeDrawer}
        />
      )}

      {isOpen && (
        <DesktopFilterPanel
          fields={fields}
          isFiltered={isFiltered}
          onSelect={updateField}
          onReset={onReset}
          className={className}
        />
      )}
    </>
  );
}
