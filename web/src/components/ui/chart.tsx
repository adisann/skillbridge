"use client";

import React, { useState } from "react";
import { Check, Plus, AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/copy";
import { CVSkillStatus } from "./badge";

export interface MarketSkillItem {
  skillName: string;
  count: number; // n (jumlah lowongan)
  percentage: number; // e.g. 78 -> 78% dari total N
  status: CVSkillStatus | "user_added";
  exampleRequirement?: string;
  isCustomLearned?: boolean;
}

interface MarketSkillBarChartProps {
  skills: MarketSkillItem[];
  totalSampleN: number;
  dataDate?: string;
  roleFilterLabel?: string;
  onAddLearning?: (skillName: string) => void;
  onToggleUserClaimed?: (skillName: string) => void;
  className?: string;
  isLoggedIn?: boolean;
  /** Jumlah skill yang tampil pertama kali; sisanya lewat tombol "Tampilkan lebih banyak". */
  pageSize?: number;
}

export function MarketSkillBarChart({
  skills,
  totalSampleN,
  dataDate = "November 2026",
  roleFilterLabel = "Semua Bidang",
  onAddLearning,
  className,
  isLoggedIn = true,
  pageSize = 15,
}: MarketSkillBarChartProps) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visibleSkills = skills.slice(0, visibleCount);
  const remaining = skills.length - visibleSkills.length;

  return (
    <div
      className={cn(
        "glass-panel rounded-2xl p-5 sm:p-6 space-y-4",
        className
      )}
    >
      {/* Metadata bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-sb-border text-xs text-sb-text-2">
        <div>
          Bidang: <span className="font-semibold text-sb-navy">{roleFilterLabel}</span>
        </div>
        <div>
          Diperbarui: <span className="font-semibold text-sb-navy">{dataDate}</span>
        </div>
      </div>

      {/* Bar Chart Rows */}
      <div className="space-y-3 pt-1">
        {visibleSkills.map((item, idx) => {
          const isFoundInCV = Boolean(isLoggedIn && item.status === "found");
          const isMissing = item.status === "missing";

          return (
            <div
              key={item.skillName}
              className="group p-3.5 rounded-xl border border-sb-border bg-white/70 hover:bg-white hover:border-sb-blue/30 hover:shadow-2xs transition-ui space-y-2.5"
            >
              {/* Row Header: Rank, Name, Badges & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <span className="w-5 text-xs font-bold text-sb-text-2 font-mono-metric">
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-bold text-sb-navy">
                    {item.skillName}
                  </span>

                  {/* Status Teks Non-Warna hanya jika sudah login */}
                  {isLoggedIn && (
                    isFoundInCV ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sb-good/10 text-sb-good border border-sb-good/30">
                        <Check className="w-3 h-3 text-sb-good stroke-[2.5]" />
                        Tercantum di CV
                      </span>
                    ) : (item.status === "needs_verification" || item.status === "user_added") ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sb-warning/15 text-sb-warning border border-sb-warning/30">
                        <AlertCircle className="w-3 h-3 text-sb-warning" />
                        {item.status === "user_added" ? "Ditambahkan oleh pengguna" : "Perlu verifikasi"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sb-mist-soft text-sb-navy border border-sb-border">
                        Belum ditemukan di CV
                      </span>
                    )
                  )}

                  {isLoggedIn && item.isCustomLearned && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sb-warning/10 text-sb-warning border border-sb-warning/20">
                      Diklaim mandiri
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right flex items-baseline gap-1.5">
                    <span className="text-xs font-medium text-sb-text-2">
                      Diminta di <strong className="text-sb-navy font-semibold font-mono-metric">{item.count}</strong> dari {totalSampleN} lowongan
                    </span>
                    <span className="text-[11px] font-semibold text-sb-blue font-mono-metric">
                      ({formatPercent(item.percentage)}%)
                    </span>
                  </div>

                  {/* Quick Action: Tambah ke daftar belajar jika belum ada di CV */}
                  {isLoggedIn && isMissing && onAddLearning && (
                    <button
                      type="button"
                      onClick={() => onAddLearning(item.skillName)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-sb-mist-soft text-sb-navy hover:bg-sb-mist border border-sb-border transition-colors cursor-pointer"
                      title="Tambahkan skill ini ke rencana belajar"
                    >
                      <Plus className="w-3.5 h-3.5 text-sb-blue" />
                      Belajar
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar Visual (CSS Bar) */}
              <div className="w-full h-2 rounded-full bg-sb-mist-soft overflow-hidden relative">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300 ease-out-strong",
                    isFoundInCV ? "bg-sb-good" : "bg-sb-sky"
                  )}
                  style={{ width: `${formatPercent(item.percentage)}%` }}
                />
              </div>

            </div>
          );
        })}
      </div>

      {remaining > 0 && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + pageSize)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full border border-sb-border bg-white text-sb-navy hover:border-sb-blue/40 hover:bg-sb-mist-faint transition-ui cursor-pointer"
          >
            Tampilkan lebih banyak
            <span className="text-xs font-medium text-sb-text-2">({Math.min(remaining, pageSize)} skill lagi)</span>
            <ChevronDown className="w-4 h-4 text-sb-blue" />
          </button>
        </div>
      )}
    </div>
  );
}
