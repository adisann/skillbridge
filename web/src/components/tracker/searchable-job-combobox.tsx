"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Check, Building2, MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CatalogJobItem {
  id: string;
  title: string;
  company: string;
  location: string;
}

interface SearchableJobComboboxProps {
  jobs: CatalogJobItem[];
  selectedJobId: string;
  onSelect: (job: CatalogJobItem | null) => void;
  label?: string;
}

export function SearchableJobCombobox({
  jobs,
  selectedJobId,
  onSelect,
  label = "Pilih dari katalog",
}: SearchableJobComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  // Filter jobs based on query
  const filteredJobs = useMemo(() => {
    if (!query.trim()) return jobs;
    const q = query.toLowerCase();
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
    );
  }, [jobs, query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectJob = (job: CatalogJobItem) => {
    onSelect(job);
    setQuery("");
    setIsOpen(false);
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
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        {selectedJob && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            Ganti pilihan
          </button>
        )}
      </div>

      {selectedJob ? (
        /* Selected State Card */
        <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start justify-between gap-3 transition-all shadow-2xs">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span className="text-xs font-bold text-slate-900 truncate">
                {selectedJob.title}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 pl-5.5">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                {selectedJob.company}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {selectedJob.location}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-blue-100/60 transition-colors shrink-0"
            title="Hapus pilihan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Search Bar & Dropdown Input */
        <div className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
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
              className="w-full h-10 rounded-xl border border-slate-300 bg-white pl-9 pr-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
              </button>
            )}
          </div>

          {/* Dropdown Results List */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl py-1 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                <span>Hasil pencarian</span>
              </div>

              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => handleSelectJob(job)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-start justify-between gap-2 border-b border-slate-50 last:border-b-0 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {job.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5 truncate">
                        <span>{job.company}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 shrink-0 pt-0.5">
                      Pilih
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center space-y-1">
                  <p className="font-semibold text-slate-700 text-xs">
                    Tidak ditemukan lowongan dengan kata kunci &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-400">
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
