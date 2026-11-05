"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, Building2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CatalogJob {
  id: string;
  title: string;
  company: string;
  location: string;
  sourceName?: string;
  sourceUrl?: string;
  matchScore?: number | null;
}

interface SearchableJobComboboxProps {
  jobs: CatalogJob[];
  selectedJobId?: string;
  onSelect: (job: CatalogJob | null) => void;
  label?: string;
}

export function SearchableJobCombobox({
  jobs,
  selectedJobId,
  onSelect,
  label = "Pilih dari Katalog Lowongan (Direkomendasikan)",
}: SearchableJobComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find selected job object
  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  // Filtered catalog jobs based on search query
  const filteredJobs = useMemo(() => {
    if (!query.trim()) return jobs.slice(0, 15);
    const q = query.toLowerCase();
    return jobs
      .filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [jobs, query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelectJob = (job: CatalogJob) => {
    onSelect(job);
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="w-full space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-sb-navy">
          {label}
        </label>
        {selectedJob && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-medium text-sb-blue hover:underline"
          >
            Ganti pilihan
          </button>
        )}
      </div>

      {selectedJob ? (
        /* Selected State Card */
        <div className="p-3 rounded-xl border border-sb-border bg-sb-mist-soft flex items-start justify-between gap-3 transition-ui shadow-2xs">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-sb-sky text-sb-navy flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span className="text-xs font-bold text-sb-navy truncate">
                {selectedJob.title}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-sb-text-2 pl-5.5">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-sb-blue" />
                {selectedJob.company}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sb-blue" />
                {selectedJob.location}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-sb-text-2 hover:text-sb-navy rounded-lg hover:bg-white/60 transition-colors shrink-0"
            title="Hapus pilihan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Search Bar & Dropdown Input */
        <div className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-3 text-sb-text-2 pointer-events-none flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Cari lowongan (Contoh: Data Analyst, Shopee)..."
              className="w-full h-10 rounded-xl border border-sb-border bg-white pl-9 pr-9 text-xs font-medium text-sb-navy placeholder:text-sb-text-2 transition-colors focus:outline-hidden focus:border-sb-blue focus:ring-2 focus:ring-sb-mist-soft"
            />

            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 text-sb-text-2 hover:text-sb-navy"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="absolute right-3 text-sb-text-2 hover:text-sb-navy"
              >
                <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
              </button>
            )}
          </div>

          {/* Dropdown Results List */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-sb-border bg-white shadow-xl py-1 text-xs">
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-sb-text-2 border-b border-sb-border flex items-center justify-between">
                <span>Hasil pencarian</span>
              </div>

              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => handleSelectJob(job)}
                    className="w-full px-3 py-2 text-left hover:bg-sb-mist-faint/50 flex items-start justify-between gap-2 border-b border-sb-border last:border-b-0 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-sb-navy group-hover:text-sb-blue transition-colors truncate">
                        {job.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-sb-text-2 pt-0.5 truncate">
                        <span>{job.company}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-sb-text-2 group-hover:text-sb-blue shrink-0 pt-0.5">
                      Pilih
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center space-y-1">
                  <p className="font-semibold text-sb-navy text-xs">
                    Tidak ditemukan lowongan dengan kata kunci &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-[11px] text-sb-text-2">
                    Kamu dapat mengisi formulir manual di bawah.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
