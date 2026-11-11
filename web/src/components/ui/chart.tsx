"use client";

import React, { useRef, useState } from "react";
import { Pagination } from "./pagination";
import { Check, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/copy";
import { CVSkillStatus } from "./badge";

export interface MarketSkillItem {
  skillName: string;
  count: number; // n (jumlah lowongan)
  percentage: number; // e.g. 78 -> 78% dari total N
  status: CVSkillStatus | "user_added";
  exampleRequirement?: string;
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
  /** Jumlah skill per halaman (bisa diubah pengguna: 10, 15, atau 30). */
  pageSize?: number;
  /** Aksi per skill (mis. "Saya kuasai", "Tambah ke rencana belajar"), tampil sebaris di kanan jumlah permintaan. */
  renderActions?: (item: MarketSkillItem) => React.ReactNode;
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
  renderActions,
}: MarketSkillBarChartProps) {
  // Paginasi: daftar skill tidak memanjang terus di mobile; ukuran halaman bisa diubah
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(pageSize);
  const rootRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.max(1, Math.ceil(skills.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * perPage;
  const visibleSkills = skills.slice(offset, offset + perPage);
  const goToPage = (next: number) => {
    setPage(next);
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "glass-panel rounded-2xl p-stack-lg sm:p-stack-xl space-y-stack-md scroll-mt-stack-6xl",
        className
      )}
    >
      {/* Metadata bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-stack-xs pb-stack-sm border-b border-sb-border text-xs text-sb-text-2">
        <div>
          Bidang: <span className="font-semibold text-sb-navy">{roleFilterLabel}</span>
        </div>
        <div>
          Diperbarui: <span className="font-semibold text-sb-navy">{dataDate}</span>
        </div>
      </div>

      {/* Bar Chart Rows */}
      <div className="space-y-stack-sm pt-stack-2xs">
        {visibleSkills.map((item, idx) => {
          const isFoundInCV = Boolean(isLoggedIn && item.status === "found");
          const isMissing = item.status === "missing";

          return (
            <div
              key={item.skillName}
              className="group p-stack-sm rounded-xl border border-sb-blue/35 bg-white hover:border-sb-blue hover:shadow-2xs transition-ui space-y-stack-xs"
            >
              {/* Row Header: Rank, Name, Badges & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-stack-xs">
                <div className="flex flex-wrap items-center gap-stack-xs sm:gap-stack-xs">
                  <span className="w-5 text-xs font-bold text-sb-text-2 font-mono-metric">
                    #{offset + idx + 1}
                  </span>
                  <span className="text-sm font-bold text-sb-navy">
                    {item.skillName}
                  </span>

                  {/* Status Teks Non-Warna hanya jika sudah login */}
                  {isLoggedIn && (
                    isFoundInCV ? (
                      <span className="inline-flex items-center gap-stack-2xs px-stack-xs py-stack-3xs rounded-full text-[11px] font-semibold bg-sb-good/10 text-sb-good border border-sb-good/30">
                        <Check className="w-3 h-3 text-sb-good stroke-[2.5]" />
                        Tercantum di CV
                      </span>
                    ) : item.status === "user_added" ? (
                      <span className="inline-flex items-center gap-stack-2xs px-stack-xs py-stack-3xs rounded-full text-[11px] font-semibold bg-sb-good/10 text-sb-good border border-sb-good/30">
                        <Check className="w-3 h-3 text-sb-good stroke-[2.5]" />
                        Ditambahkan oleh pengguna
                      </span>
                    ) : item.status === "needs_verification" ? (
                      <span className="inline-flex items-center gap-stack-2xs px-stack-xs py-stack-3xs rounded-full text-[11px] font-semibold bg-sb-warning/15 text-sb-warning border border-sb-warning/30">
                        <AlertCircle className="w-3 h-3 text-sb-warning" />
                        Perlu verifikasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-stack-2xs px-stack-xs py-stack-3xs rounded-full text-[11px] font-semibold bg-sb-mist-soft text-sb-navy border border-sb-border">
                        Belum ditemukan di CV
                      </span>
                    )
                  )}

                </div>

                {/* Kanan: aksi lalu jumlah permintaan (jumlah selalu paling kanan), satu baris dan sejajar tengah */}
                <div className="ml-auto flex flex-wrap items-center justify-end gap-stack-xs sm:gap-stack-sm">
                  {renderActions?.(item)}
                  <div className="text-right flex items-baseline gap-stack-2xs">
                    <span className="text-xs font-medium text-sb-text-2">
                      Diminta di <strong className="text-sb-navy font-semibold font-mono-metric">{item.count}</strong> dari {totalSampleN} lowongan target
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
                      className="inline-flex items-center gap-stack-2xs px-stack-xs py-stack-2xs text-xs font-semibold rounded-full bg-sb-mist-soft text-sb-navy hover:bg-sb-mist border border-sb-border transition-colors cursor-pointer"
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

      {skills.length > 10 && (
        <Pagination
          currentPage={currentPage}
          totalItems={skills.length}
          pageSize={perPage}
          onPageChange={goToPage}
          onPageSizeChange={(size) => {
            setPerPage(size);
            setPage(1);
          }}
          pageSizeOptions={[10, 15, 30]}
          itemLabel="skill"
        />
      )}
    </div>
  );
}
