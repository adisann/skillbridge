"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  label: string;
  options: SearchableOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

/**
 * Dropdown dengan kolom pencarian (combobox). Mencari di label dan deskripsi.
 * Keyboard: panah atas/bawah memilih, Enter menerapkan, Escape menutup.
 */
export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Pilih…",
  searchPlaceholder = "Cari…",
  emptyText = "Tidak ada yang cocok",
  className,
}: SearchableSelectProps) {
  const id = useId();
  const listId = `${id}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.value === value) || null;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.description || ""}`.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openList = () => {
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const pick = (opt: SearchableOption) => {
    onChange(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) pick(filtered[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <span id={`${id}-label`} className="block text-xs font-bold text-sb-navy mb-stack-2xs">{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => (open ? setOpen(false) : openList())}
        className="w-full min-h-11 px-stack-sm py-stack-xs rounded-xl border border-sb-border bg-white text-left flex items-center gap-stack-sm hover:border-sb-blue/50 focus:outline-none focus:ring-2 focus:ring-sb-blue transition-colors cursor-pointer"
      >
        <span id={`${id}-value`} className="flex-1 min-w-0">
          {selected ? (
            <>
              <span className="block text-sm font-bold text-sb-navy truncate">{selected.label}</span>
              {selected.description && <span className="block text-[11px] text-sb-text-2 truncate">{selected.description}</span>}
            </>
          ) : (
            <span className="text-sm text-sb-text-2">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-sb-text-2 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-40 mt-stack-2xs w-full rounded-xl border border-sb-border bg-white shadow-xl overflow-hidden">
          <div className="p-stack-xs border-b border-sb-border">
            <div className="relative">
              <Search className="w-4 h-4 text-sb-text-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={filtered[active] ? `${id}-opt-${active}` : undefined}
                aria-label={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-stack-2xl pr-stack-sm rounded-lg border border-sb-border bg-white text-sm text-sb-navy placeholder:text-sb-text-2/70 focus:outline-none focus:ring-2 focus:ring-sb-blue"
              />
            </div>
          </div>
          <ul id={listId} role="listbox" aria-labelledby={`${id}-label`} className="max-h-64 overflow-y-auto p-stack-2xs">
            {filtered.length === 0 && <li className="px-stack-sm py-stack-sm text-xs text-sb-text-2">{emptyText}</li>}
            {filtered.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(opt)}
                  className={cn(
                    "px-stack-sm py-stack-xs rounded-lg cursor-pointer flex items-start gap-stack-xs",
                    i === active ? "bg-sb-mist-faint" : "",
                    isSelected && "bg-sb-mist-soft"
                  )}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-sb-navy">{opt.label}</span>
                    {opt.description && <span className="block text-[11px] text-sb-text-2 truncate">{opt.description}</span>}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-sb-blue shrink-0 mt-stack-3xs" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
