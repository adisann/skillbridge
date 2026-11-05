import React from "react";

// Chevron and stem pixel arrow layout (coordinates: [col, row, i_from_bottom])
export const PIXEL_ARROW_BLOCKS = [
  // Chevron tip (row 0, i=7)
  { col: 3, row: 0, i: 7, color: "bg-sb-sky" },
  // Row 1 (i=6)
  { col: 2, row: 1, i: 6, color: "bg-sb-sky" },
  { col: 4, row: 1, i: 6, color: "bg-sb-mist" },
  // Row 2 (i=5)
  { col: 1, row: 2, i: 5, color: "bg-sb-mist" },
  { col: 5, row: 2, i: 5, color: "bg-sb-sky" },
  // Row 3 (i=4)
  { col: 0, row: 3, i: 4, color: "bg-sb-sky" },
  { col: 6, row: 3, i: 4, color: "bg-sb-mist" },
  // Stem (rows 4 to 8, i=3 down to 0)
  { col: 3, row: 4, i: 3, color: "bg-sb-sky" },
  { col: 3, row: 5, i: 2, color: "bg-sb-mist" },
  { col: 3, row: 6, i: 1, color: "bg-sb-sky" },
  { col: 3, row: 7, i: 0, color: "bg-sb-mist" },
];

export function PixelArrow({
  delay = "0s",
  className = "",
  scale = 1,
}: {
  delay?: string;
  className?: string;
  scale?: number;
}) {
  return (
    <div
      className={`sb-arrow absolute pointer-events-none ${className}`}
      style={{ animationDelay: delay }}
      aria-hidden="true"
    >
      <div
        className="relative w-[84px] h-[104px]"
        style={
          scale !== 1
            ? {
                transform: `scale(${scale})`,
                transformOrigin: "bottom center",
              }
            : undefined
        }
      >
        {PIXEL_ARROW_BLOCKS.map((b, idx) => (
          <span
            key={idx}
            className={`sb-box-pulse absolute w-2.5 h-2.5 rounded-2xs ${b.color} opacity-90`}
            style={{
              left: `${b.col * 12}px`,
              top: `${b.row * 13}px`,
              animationDelay: `${b.i * 120}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
