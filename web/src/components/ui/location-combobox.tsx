"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FilterOption } from "@/lib/job-filters";
import { cn } from "@/lib/utils";

export function LocationCombobox({ id, value, options, onChange, className }: {
  id: string; value: string; options: FilterOption[]; onChange: (value: string) => void; className?: string;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [active, setActive] = useState(-1);
  const [draft, setDraft] = useState<{ value: string; text: string } | null>(null);
  const selected = options.find((option) => option.value === value);
  const text = draft?.value === value ? draft.text : value === "all" ? "" : selected?.label || value;
  const suggestions = filtering ? options.filter((option) => option.label.toLowerCase().includes(text.trim().toLowerCase()) || option.value.toLowerCase().includes(text.trim().toLowerCase())) : options;
  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);
  const choose = (option: FilterOption) => {
    setDraft({ value: option.value, text: option.value === "all" ? "" : option.label });
    onChange(option.value); setOpen(false); setFiltering(false); setActive(-1);
  };
  return (
    <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
      <div className="relative">
        <input ref={input} id={id} type="text" role="combobox" aria-autocomplete="list" aria-expanded={open}
          aria-controls={listId} aria-activedescendant={open && active >= 0 && suggestions[active] ? `${listId}-${active}` : undefined}
          aria-describedby={`${listId}-help`} autoComplete="off" placeholder="Semua Lokasi" value={text}
          className={cn(className, "pr-10 placeholder:text-sb-text-2")}
          onFocus={() => { setOpen(true); setFiltering(false); }}
          onChange={(event) => {
            const next = event.target.value;
            const nextValue = next.trim() ? next : "all";
            setDraft({ value: nextValue, text: next }); onChange(nextValue); setFiltering(true); setOpen(true); setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault(); setOpen(true);
              setActive((previous) => suggestions.length ? previous < 0 ? event.key === "ArrowDown" ? 0 : suggestions.length - 1 : (previous + (event.key === "ArrowDown" ? 1 : -1) + suggestions.length) % suggestions.length : -1);
            } else if (event.key === "Enter") {
              event.preventDefault(); if (open && suggestions[active]) choose(suggestions[active]); else setOpen(false);
            } else if (event.key === "Escape") { setOpen(false); setActive(-1); }
          }} />
        <button type="button" aria-label="Tampilkan pilihan lokasi" aria-expanded={open} aria-controls={listId}
          className="absolute inset-y-0 right-0 px-stack-sm text-sb-text-2 rounded-r-xl focus-visible:outline-2 focus-visible:outline-sb-blue"
          onClick={() => { input.current?.focus(); setFiltering(false); setOpen(!open); setActive(-1); }}>
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <p id={`${listId}-help`} className="mt-1 text-[10px] text-sb-text-2">Ketik kota/provinsi atau pilih lokasi.</p>
      {open && <ul id={listId} role="listbox" aria-label="Pilihan lokasi kerja" className="absolute left-0 right-0 top-11 z-40 max-h-52 overflow-y-auto rounded-xl border border-sb-border bg-white py-1 shadow-lg">
        {suggestions.map((option, index) => <li key={option.value} role="presentation">
          <button id={`${listId}-${index}`} type="button" role="option" aria-selected={value === option.value} tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option)}
            className={cn("w-full px-stack-sm py-stack-xs text-left text-xs text-sb-navy hover:bg-sb-mist-soft", active === index && "bg-sb-mist-soft")}>{option.label}</button>
        </li>)}
        {suggestions.length === 0 && <li role="presentation" className="px-stack-sm py-stack-xs text-xs text-sb-text-2">Memakai lokasi yang diketik: {text}</li>}
      </ul>}
    </div>
  );
}
