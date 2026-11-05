import React from "react";
import { Check, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CVSkillStatus } from "./badge";

export interface MarketSkillItem {
  skillName: string;
  count: number; // n (jumlah lowongan)
  percentage: number; // e.g. 78 -> 78% dari total N
  status: CVSkillStatus;
  exampleRequirement?: string;
  isCustomLearned?: boolean;
}

export interface MarketSkillBarChartProps {
  skills: MarketSkillItem[];
  totalSampleN: number;
  dataDate?: string;
  roleFilterLabel?: string;
  onAddLearning?: (skillName: string) => void;
  onToggleUserClaimed?: (skillName: string) => void;
  className?: string;
}

export function MarketSkillBarChart({
  skills,
  totalSampleN,
  dataDate = "November 2026",
  roleFilterLabel = "Semua Role",
  onAddLearning,
  className,
}: MarketSkillBarChartProps) {
  return (
    <div
      className={cn(
        "p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4",
        className
      )}
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">
            Frekuensi Kebutuhan Skill di Pasar
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter: <span className="font-semibold text-slate-700">{roleFilterLabel}</span> · Diperbarui: {dataDate}
          </p>
        </div>
      </div>

      {/* Bar Chart Rows */}
      <div className="space-y-3.5 pt-1">
        {skills.map((item, idx) => {
          const isFoundInCV = item.status === "found";
          const isMissing = item.status === "missing";

          return (
            <div
              key={item.skillName}
              className="group p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all space-y-2"
            >
              {/* Row Header: Rank, Name, Badges & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 text-xs font-bold text-slate-400 font-mono">
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {item.skillName}
                  </span>

                  {/* Status Teks Non-Warna */}
                  {isFoundInCV ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                      Tercantum di CV
                    </span>
                  ) : item.status === "needs_verification" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                      <AlertCircle className="w-3 h-3 text-blue-600" />
                      Perlu verifikasi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      Belum ditemukan di CV
                    </span>
                  )}

                  {item.isCustomLearned && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Diklaim mandiri
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right flex items-baseline gap-1.5">
                    <span className="text-xs font-medium text-slate-600">
                      Diminta di <strong className="text-slate-900 font-semibold">{item.count}</strong> dari {totalSampleN} lowongan
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      ({item.percentage}%)
                    </span>
                  </div>

                  {/* Quick Action: Tambah ke daftar belajar jika belum ada di CV */}
                  {isMissing && onAddLearning && (
                    <button
                      type="button"
                      onClick={() => onAddLearning(item.skillName)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                      title="Tambahkan skill ini ke rencana belajar"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Belajar
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar Visual (CSS Bar) */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isFoundInCV
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                      : "bg-gradient-to-r from-blue-500 to-blue-600"
                  )}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>

              {/* Contoh Persyaratan dari Lowongan Nyata */}
              {item.exampleRequirement && (
                <p className="text-[11px] text-slate-500 italic pl-1 border-l-2 border-slate-200 line-clamp-1">
                  Contoh: &ldquo;{item.exampleRequirement}&rdquo;
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
