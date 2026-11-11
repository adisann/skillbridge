import React from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrackerHeaderProps {
  stageCounts: Record<string, number>;
  activeStageFilter: string;
  onStageFilterChange: (stageId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: "priority" | "match" | "date";
  onSortChange: (sort: "priority" | "match" | "date") => void;
  viewMode: "table" | "board";
  onViewModeChange: (mode: "table" | "board") => void;
  compareMode: boolean;
  onToggleCompareMode: () => void;
  canCompare: boolean;
  onOpenAdd: () => void;
}

export function TrackerHeader({
  stageCounts,
  activeStageFilter,
  onStageFilterChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  compareMode,
  onToggleCompareMode,
  canCompare,
  onOpenAdd,
}: TrackerHeaderProps) {
  const STAGES_PIPELINE: Array<{ id: string; label: string; count: number }> = [
    { id: "all", label: "Semua", count: stageCounts.all || 0 },
    { id: "bookmarked", label: "Tersimpan", count: stageCounts.bookmarked || 0 },
    { id: "applying", label: "Siapkan Berkas", count: stageCounts.applying || 0 },
    { id: "applied", label: "Sudah Melamar", count: stageCounts.applied || 0 },
    { id: "interviewing", label: "Wawancara", count: stageCounts.interviewing || 0 },
    { id: "offered", label: "Penawaran", count: stageCounts.offered || 0 },
    { id: "accepted", label: "Diterima", count: stageCounts.accepted || 0 },
    { id: "rejected", label: "Ditolak", count: stageCounts.rejected || 0 },
  ];

  return (
    <div className="space-y-stack-xl">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-stack-md">
        <div>
          <div className="flex items-center gap-stack-xs text-xs font-semibold text-sb-text-2 mb-stack-2xs">
            <Link href="/dashboard" className="hover:text-sb-blue transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-sb-navy">Lamaran Saya</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sb-navy tracking-tight flex items-center gap-stack-xs">
            <span>Lamaran Saya</span>
          </h1>
          <p className="text-xs sm:text-sm text-sb-text-2 mt-stack-2xs">
            Kelola 7 tahapan lamaran kerjamu dan atur prioritas minat kariermu secara terstruktur.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-stack-xs">
          {canCompare && (
            <Button
              variant={compareMode ? "secondary" : "outline"}
              size="sm"
              onClick={onToggleCompareMode}
              aria-pressed={compareMode}
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            >
              {compareMode ? "Batal bandingkan" : "Bandingkan lowongan"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAdd}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tambah Lowongan
          </Button>
        </div>
      </div>

      {/* Pipeline Stage Tabs */}
      <div className="glass-panel rounded-2xl p-stack-xs shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-stack-2xs min-w-max">
          {STAGES_PIPELINE.map((stage) => {
            const isActive = activeStageFilter === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onStageFilterChange(stage.id)}
                className={`flex items-center gap-stack-xs px-stack-sm py-stack-xs rounded-xl text-xs font-bold transition-ui ${
                  isActive
                    ? "bg-sb-sky text-sb-navy shadow-xs"
                    : "text-sb-text-2 hover:bg-white/70 hover:text-sb-navy"
                }`}
              >
                <span>{stage.label}</span>
                <span
                  className={`px-stack-xs py-stack-3xs rounded-full text-xs font-extrabold font-mono-metric ${
                    isActive ? "bg-white/40 text-sb-navy" : "bg-sb-mist-soft text-sb-blue"
                  }`}
                >
                  {stage.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Controls & View Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-stack-sm glass-panel p-stack-sm rounded-2xl">
        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-sb-text-2 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            aria-label="Cari lowongan yang dilacak"
            placeholder="Cari lowongan, posisi, perusahaan..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-stack-2xl pr-stack-sm py-stack-2xs text-xs rounded-xl border border-sb-border focus:outline-hidden focus:border-sb-blue bg-white/70"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end w-full sm:w-auto gap-stack-xs min-w-0">
          {/* Sort by */}
          <label className="flex items-center gap-stack-2xs text-xs text-sb-text-2 font-semibold min-w-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sb-text-2 shrink-0" aria-hidden="true" />
            <span>Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as "priority" | "match" | "date")}
              className="py-stack-2xs px-stack-xs rounded-xl border border-sb-border bg-white/80 text-xs font-bold text-sb-navy focus:outline-hidden cursor-pointer"
            >
              <option value="priority">Prioritas tertinggi</option>
              <option value="match">Kecocokan CV tertinggi</option>
              <option value="date">Terbaru disimpan</option>
            </select>
          </label>

          {/* View switcher */}
          <div className="flex items-center border border-sb-border rounded-xl p-stack-3xs bg-sb-mist-faint">
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`p-stack-2xs rounded-lg text-xs font-bold transition-ui ${
                viewMode === "table" ? "bg-white text-sb-blue shadow-2xs" : "text-sb-text-2 hover:text-sb-navy"
              }`}
              title="Tampilan tabel"
              aria-label="Tampilan tabel"
              aria-pressed={viewMode === "table"}
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("board")}
              className={`p-stack-2xs rounded-lg text-xs font-bold transition-ui ${
                viewMode === "board" ? "bg-white text-sb-blue shadow-2xs" : "text-sb-text-2 hover:text-sb-navy"
              }`}
              title="Tampilan papan"
              aria-label="Tampilan papan"
              aria-pressed={viewMode === "board"}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
