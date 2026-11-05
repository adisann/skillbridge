"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
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
        "flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/90 select-none",
        className
      )}
    >
      {/* Mobile view: Compact (Sebelumnya, "Halaman X dari Y", Berikutnya) */}
      <div className="flex sm:hidden items-center justify-between gap-2 w-full">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className="px-2.5 py-1.5 text-xs font-semibold"
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Sebelumnya
        </Button>

        <span className="text-xs font-medium text-slate-600">
          Halaman <strong className="font-bold text-slate-900">{safeCurrentPage}</strong> dari{" "}
          <strong className="font-bold text-slate-900">{totalPages}</strong>
        </span>

        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          className="px-2.5 py-1.5 text-xs font-semibold"
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Berikutnya
        </Button>
      </div>

      {/* Desktop view: Left info & Rows per page */}
      <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
        <span>
          Menampilkan{" "}
          <strong className="font-semibold text-slate-800">
            {totalItems === 0 ? "0" : `${startIndex}–${endIndex}`}
          </strong>{" "}
          dari <strong className="font-semibold text-slate-800">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span className="text-slate-500 font-medium">Per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                if (onPageSizeChange) onPageSizeChange(newSize);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-hidden cursor-pointer"
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

      {/* Desktop view: Navigation buttons & numbered pills */}
      <div className="hidden sm:flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className="px-2.5 py-1 text-xs font-medium"
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          Sebelumnya
        </Button>

        <div className="flex items-center gap-1 px-1">
          {pages.map((p, idx) => {
            if (p === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 select-none"
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
                  "w-8 h-8 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer",
                  isActive
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
          className="px-2.5 py-1 text-xs font-medium"
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}

