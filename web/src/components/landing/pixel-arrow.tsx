import React from "react";
import { cn } from "@/lib/utils";

interface PixelBlock {
  col: number; // 0 sampai 6 (kolom tengah = 3)
  row: number; // 0 sampai 8
}

/**
 * Peta grid eksplisit 7 kolom x 9 baris (simetris, tanpa celah):
 * row0: . . . X . . .
 * row1: . . X X X . .
 * row2: . X . X . X .
 * row3: X . . X . . X
 * row4: . . . X . . .
 * row5: . . . X . . .
 * row6: . . . X . . .
 * row7: . . . X . . .
 * row8: . . . X . . .
 *
 * Kolom tengah (col=3) utuh dari row0 s.d. row8 sehingga kepala dan batang menyambung.
 */
const PIXEL_ARROW_GRID: PixelBlock[] = [
  // row 0: puncak panah
  { row: 0, col: 3 },
  // row 1: sayap dalam + tengah
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  // row 2: sayap tengah + batang
  { row: 2, col: 1 },
  { row: 2, col: 3 },
  { row: 2, col: 5 },
  // row 3: ujung sayap terluar + batang
  { row: 3, col: 0 },
  { row: 3, col: 3 },
  { row: 3, col: 6 },
  // row 4 - 8: batang tengah lurus ke bawah
  { row: 4, col: 3 },
  { row: 5, col: 3 },
  { row: 6, col: 3 },
  { row: 7, col: 3 },
  { row: 8, col: 3 },
];

interface PixelArrowProps {
  delay?: string;
  className?: string;
  px?: number; // ukuran kotak dalam px (default 12 di hero, 18 di penutup)
  gap?: number; // celah antar kotak dalam px (default 4 di hero, 5 di penutup)
  style?: React.CSSProperties;
}

export function PixelArrow({
  delay = "0s",
  className = "",
  px = 12,
  gap = 4,
  style,
}: PixelArrowProps) {
  return (
    <div
      className={cn("sb-arrow pointer-events-none select-none", className)}
      style={{
        animationDelay: delay,
        ["--px" as string]: `${px}px`,
        ["--gap" as string]: `${gap}px`,
        ...style,
      }}
      aria-hidden="true"
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(7, var(--px))",
          gridTemplateRows: "repeat(9, var(--px))",
          gap: "var(--gap)",
          width: "fit-content",
          height: "fit-content",
        }}
      >
        {PIXEL_ARROW_GRID.map((b) => {
          const isCenter = b.col === 3;
          // Delay bertahap dari baris bawah (row 8, i=0) ke atas (row 0, i=8)
          const i = 8 - b.row;

          return (
            <span
              key={`${b.row}-${b.col}`}
              className={cn("sb-box-pulse rounded-[3px] block")}
              style={{
                // Gradient warna tombol utama: ujung panah Biru penghubung, makin ke ekor makin muda; sayap sedikit lebih muda
                background: `color-mix(in srgb, var(--sb-blue) ${Math.round(100 - (b.row / 8) * 55) - (isCenter ? 0 : 15)}%, var(--sb-sky))`,
                gridColumn: b.col + 1,
                gridRow: b.row + 1,
                width: "var(--px)",
                height: "var(--px)",
                ["--i" as string]: i,
                animationDelay: `calc(var(--i) * 90ms)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
