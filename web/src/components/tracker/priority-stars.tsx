"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

interface PriorityStarsProps {
  value: number; // 1 to 5
  onChange?: (val: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const PRIORITY_LABELS: Record<number, string> = {
  1: "Prioritas Rendah (Cadangan)",
  2: "Prioritas Cukup",
  3: "Prioritas Menengah",
  4: "Prioritas Tinggi",
  5: "Target Impian (Top Choice)",
};

export function PriorityStars({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: PriorityStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSize = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4";
  const activeRating = hoverValue !== null ? hoverValue : value;

  return (
    <div
      className="inline-flex items-center gap-0.5 group"
      title={PRIORITY_LABELS[value] || `${value} Bintang`}
      onMouseLeave={() => !readOnly && setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= activeRating;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly && onChange) onChange(star);
            }}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            className={`${readOnly ? "cursor-default" : "cursor-pointer hover:scale-115"} p-0.5 transition-transform duration-150 focus:outline-hidden`}
            aria-label={`${star} Bintang`}
          >
            <Star
              className={`${starSize} transition-colors ${
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-sb-border group-hover:text-sb-text-2"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

