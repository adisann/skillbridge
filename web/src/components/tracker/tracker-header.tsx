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

export interface TrackerHeaderProps {
  stageCounts: Record<string, number>;
  activeStageFilter: string;
  onStageFilterChange: (stageId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: "priority" | "match" | "date";
  onSortChange: (sort: "priority" | "match" | "date") => void;
  viewMode: "table" | "board";
  onViewModeChange: (mode: "table" | "board") => void;
  selectedCount: number;
  onOpenCompare: () => void;
  onClearSelection: () => void;
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
  selectedCount,
  onOpenCompare,
  onClearSelection,
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
    <div className="space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800">Lamaran Saya</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Lamaran Saya
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Kelola 7 tahapan lamaran kerjamu dan atur prioritas minat kariermu secara terstruktur.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedCount >= 2 && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCompare}
              leftIcon={<SlidersHorizontal className="w-4 h-4 text-white" />}
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
            >
              Bandingkan {selectedCount} Lowongan
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAdd}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + Tambah Target Manual
          </Button>
        </div>
      </div>

      {/* Pipeline Stage Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {STAGES_PIPELINE.map((stage) => {
            const isActive = activeStageFilter === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onStageFilterChange(stage.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors duration-150 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{stage.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari lowongan, posisi, perusahaan..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2.5">
          {/* Sort by */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as "priority" | "match" | "date")}
              className="py-1 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="priority">Prioritas Bintang (Tertinggi)</option>
              <option value="match">Skor Match CV (Tertinggi)</option>
              <option value="date">Terbaru Disimpan</option>
            </select>
          </div>

          {/* View switcher */}
          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-100/60">
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Tampilan Tabel & Perbandingan"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("board")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === "board" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Tampilan Kanban Board Pipeline"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Counter & Multi Action Bar */}
      {selectedCount > 0 && (
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <span className="font-bold">{selectedCount} lowongan dipilih</span>
            <span className="text-indigo-600">• Kamu dapat membandingkan kecocokan skill & gaji secara berdampingan.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCompare}
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              Buka Matriks Perbandingan
            </Button>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-xs text-indigo-700 hover:underline font-semibold ml-2 cursor-pointer"
            >
              Batalkan Pilihan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

