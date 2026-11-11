import React from "react";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (columnKey: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends object>({
  columns,
  data,
  keyExtractor,
  sortColumn,
  sortDirection,
  onSort,
  emptyMessage = "Tidak ada data yang tersedia.",
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-hidden rounded-xl border border-sb-border bg-white shadow-xs", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-sb-border bg-sb-mist-faint/60 text-xs font-semibold text-sb-text-2 uppercase tracking-wider">
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                const alignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left";

                return (
                  <th
                    key={col.key}
                    className={cn(
                      "px-stack-md py-stack-sm select-none",
                      alignClass,
                      col.sortable && "cursor-pointer hover:bg-sb-mist-soft transition-colors",
                      col.className
                    )}
                    onClick={() => col.sortable && onSort && onSort(col.key)}
                  >
                    <div
                      className={cn(
                        "inline-flex items-center gap-stack-2xs",
                        col.align === "right" && "justify-end",
                        col.align === "center" && "justify-center"
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-sb-text-2">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5 text-sb-blue" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-sb-blue" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-sb-border text-sb-navy">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-stack-md py-stack-2xl text-center text-xs text-sb-text-2"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={keyExtractor(row, idx)}
                  className="hover:bg-sb-mist-faint/50 transition-colors"
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left";

                    return (
                      <td
                        key={col.key}
                        className={cn("px-stack-md py-stack-sm text-xs leading-relaxed", alignClass, col.className)}
                      >
                        {col.render ? col.render(row, idx) : String((row as Record<string, unknown>)[col.key] ?? "")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
