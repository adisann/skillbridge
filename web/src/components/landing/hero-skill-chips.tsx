"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const EXIT_MS = 300;
const RETURN_MS = 4500;

interface HeroSkillChipsProps {
  chips: readonly string[];
}

/**
 * Chip skill di hero yang bisa disilang. Chip yang disilang mengecil lalu memudar,
 * lalu muncul kembali sendiri (naik perlahan dari bawah) setelah beberapa detik (satu per satu sesuai waktu silangnya).
 */
export function HeroSkillChips({ chips }: HeroSkillChipsProps) {
  // leaving: sedang animasi keluar; gone: sudah hilang menunggu kembali
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(new Set());
  const [gone, setGone] = useState<ReadonlySet<string>>(new Set());
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);

  const dismiss = useCallback(
    (chip: string) => {
      setLeaving((prev) => new Set(prev).add(chip));
      later(() => {
        setLeaving((prev) => {
          const next = new Set(prev);
          next.delete(chip);
          return next;
        });
        setGone((prev) => new Set(prev).add(chip));
        later(() => {
          setGone((prev) => {
            const next = new Set(prev);
            next.delete(chip);
            return next;
          });
        }, RETURN_MS);
      }, EXIT_MS);
    },
    [later]
  );

  return (
    <div className="flex flex-wrap gap-1.5 pt-0.5 min-h-[30px]">
      {chips.map((chip) => {
        if (gone.has(chip)) return null;
        const isLeaving = leaving.has(chip);
        return (
          <span
            key={chip}
            style={{ transitionDuration: `${EXIT_MS}ms` }}
            className={cn(
              "group/chip inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full text-xs font-medium",
              "bg-sb-mist-soft text-sb-navy border border-sb-border select-none animate-rise-in",
              "transition-[transform,opacity] ease-out-strong",
              isLeaving
                ? "scale-50 opacity-0 pointer-events-none"
                : "hover:-translate-y-0.5 hover:scale-[1.04]"
            )}
          >
            {chip}
            <button
              type="button"
              onClick={() => dismiss(chip)}
              aria-label={`Sembunyikan ${chip}`}
              className={cn(
                "relative inline-flex h-4 w-4 items-center justify-center rounded-full text-sb-text-2 cursor-pointer before:absolute before:-inset-2 before:content-['']",
                "transition-transform duration-150 ease-out-strong",
                "hover:scale-125 active:scale-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sb-blue"
              )}
            >
              <X className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
            </button>
          </span>
        );
      })}
    </div>
  );
}
