import React from "react";

/**
 * Transisi piksel antara blok biru gelap dan section putih (turun setelah statistik, naik sebelum penutup).
 * Warna solid tanpa transparan: baris atas didominasi biru gelap (menyambung strip),
 * makin ke bawah makin jarang dan makin terang. Beberapa piksel aksen berganti warna pelan.
 * Pola deterministik (tanpa Math.random) agar HTML server dan klien sama.
 */

const COLS = 32;
// Per baris: peluang terisi dan palet warna yang dipakai (gelap di atas → terang di bawah)
const ROWS: Array<{ fill: number; palette: string[] }> = [
  // Baris yang menempel blok biru: warna sama dengan tepi blok (#1E40AF) supaya terlihat menyambung
  { fill: 0.78, palette: ["#1E40AF", "#1E40AF", "#1E40AF", "#2747B8", "#3150C0"] },
  // Lalu makin muda per baris, mengikuti gradient blok, sampai hampir putih
  { fill: 0.42, palette: ["#3B58C6", "#4A66CF", "#5A74D7"] },
  { fill: 0.2, palette: ["#7C96E6", "#93A9EB", "#A6B8EE"] },
  { fill: 0.08, palette: ["#C1CFF3", "#D6DFF7"] },
];

function pseudoRandom(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

type Cell = { color: string; twinkle: boolean; alt: string; delay: number } | null;

function buildCells(seed: number): Cell[][] {
  return ROWS.map((row, r) =>
    Array.from({ length: COLS }, (_, c) => {
      const i = r * COLS + c + seed;
      if (pseudoRandom(i + 1) > row.fill) return null;
      const color = row.palette[Math.floor(pseudoRandom(i + 101) * row.palette.length)];
      const twinkle = pseudoRandom(i + 202) < 0.12;
      // Kedip hanya ke warna lain di baris yang sama, jadi tetap menyatu dengan gradient
      const alt = row.palette[Math.floor(pseudoRandom(i + 303) * row.palette.length)];
      return { color, twinkle: twinkle && alt !== color, alt, delay: -Math.round(pseudoRandom(i + 404) * 50) / 10 };
    })
  );
}

// Arah turun: gelap di atas → putih di bawah (setelah statistik).
// Arah naik: putih di atas → gelap di bawah (sebelum penutup), pola berbeda agar tidak terlihat dicerminkan.
const CELLS_DOWN = buildCells(0).flat();
const CELLS_UP = buildCells(1000).reverse().flat();

export function LandingPixelBand({ direction = "down" }: { direction?: "down" | "up" }) {
  const cells = direction === "up" ? CELLS_UP : CELLS_DOWN;
  return (
    <div className="sb-pixel-band" aria-hidden="true">
      <div className="sb-pixel-grid" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
        {cells.map((cell, idx) =>
          cell ? (
            <span
              key={idx}
              className="sb-pixel-cell"
              data-twinkle={cell.twinkle ? "true" : undefined}
              style={{
                background: cell.color,
                ["--c1" as string]: cell.color,
                ["--c2" as string]: cell.alt,
                animationDelay: cell.twinkle ? `${cell.delay}s` : undefined,
              }}
            />
          ) : (
            <span key={idx} />
          )
        )}
      </div>
    </div>
  );
}
