"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = "lowongan",
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, safeCurrentPage * pageSize);

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis", totalPages];
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [
        1,
        "ellipsis",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "ellipsis",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "ellipsis",
      totalPages,
    ];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={cn(
        "flex flex-col gap-3 pt-4 border-t border-sb-border select-none w-full",
        className
      )}
    >
      {/* Row 1: Summary counter on left, per-page dropdown on right */}
      <div className="flex items-center justify-between gap-2 w-full text-xs text-sb-text-2">
        <span className="truncate">
          Menampilkan{" "}
          <strong className="font-semibold text-sb-navy">
            {totalItems === 0 ? "0" : `${startIndex}–${endIndex}`}
          </strong>{" "}
          dari <strong className="font-semibold text-sb-navy">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-sb-text-2 font-medium hidden xs:inline">Per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                if (onPageSizeChange) onPageSizeChange(newSize);
              }}
              aria-label="Jumlah baris per halaman"
              className="px-2 py-1 rounded-lg border border-sb-border bg-white text-xs font-semibold text-sb-navy hover:border-sb-blue/40 focus:outline-hidden cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Row 2: Navigation controls (Previous, pills, Next) — tidak perlu bila hanya satu halaman */}
      {totalPages > 1 && (
      <div className="flex items-center justify-center gap-1 w-full max-w-full overflow-hidden py-0.5">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          aria-label="Halaman sebelumnya"
          className="h-8 px-2 sm:px-2.5 text-xs font-medium shrink-0"
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          <span className="hidden xl:inline ml-1">Sebelumnya</span>
        </Button>

        <div className="flex items-center gap-1 px-0.5 shrink-0">
          {pages.map((p, idx) => {
            if (p === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs text-sb-text-2/60 select-none shrink-0"
                >
                  …
                </span>
              );
            }

            const isActive = p === safeCurrentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer shrink-0",
                  isActive
                    ? "bg-sb-sky text-sb-navy font-bold shadow-2xs"
                    : "text-sb-text-2 hover:bg-sb-mist-soft hover:text-sb-navy"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {p}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          aria-label="Halaman berikutnya"
          className="h-8 px-2 sm:px-2.5 text-xs font-medium shrink-0"
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          <span className="hidden xl:inline mr-1">Berikutnya</span>
        </Button>
      </div>
      )}
    </div>
  );
}

