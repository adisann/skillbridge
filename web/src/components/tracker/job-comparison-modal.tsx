"use client";

import React, { useEffect } from "react";
import { X, ExternalLink, Check, AlertTriangle } from "lucide-react";
import { TrackedJob, STAGE_CONFIG } from "@/types/tracker";
import { PriorityStars } from "./priority-stars";
import { MatchScore } from "./match-score";
import { Button } from "@/components/ui/button";

interface JobComparisonModalProps {
  jobs: TrackedJob[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateStage: (jobId: string, newStage: TrackedJob["stage"]) => void;
}

const STAGE_OPTIONS: Array<{ value: TrackedJob["stage"]; label: string }> = [
  { value: "bookmarked", label: "Tersimpan" },
  { value: "applying", label: "Siapkan Berkas" },
  { value: "applied", label: "Sudah Melamar" },
  { value: "interviewing", label: "Wawancara" },
  { value: "offered", label: "Penawaran" },
  { value: "accepted", label: "Diterima" },
  { value: "rejected", label: "Ditolak" },
];

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <tr className="border-t border-sb-border align-top">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-sb-mist-faint px-stack-md py-stack-md text-left text-sm font-semibold text-sb-navy w-40 min-w-40"
      >
        {label}
        {hint && <span className="block mt-stack-3xs text-xs font-normal text-sb-text-2">{hint}</span>}
      </th>
      {children}
    </tr>
  );
}

export function JobComparisonModal({ jobs, isOpen, onClose, onUpdateStage }: JobComparisonModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || jobs.length === 0) return null;

  // Sorot skor kecocokan tertinggi supaya perbandingan cepat terbaca
  const scored = jobs.filter((j) => j.matchStatus !== "insufficient_evidence" && j.matchScore > 0);
  const bestScore = scored.length > 1 ? Math.max(...scored.map((j) => j.matchScore)) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sb-navy/50 p-stack-sm sm:p-stack-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] shadow-2xl border border-sb-border flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-stack-lg sm:px-stack-xl py-stack-md border-b border-sb-border flex items-start justify-between gap-stack-md">
          <div>
            <h3 id="compare-title" className="text-lg font-bold text-sb-navy">
              Bandingkan {jobs.length} lowongan
            </h3>
            <p className="text-sm text-sb-text-2 mt-stack-3xs">
              Persentase menunjukkan kecocokan CV aktifmu dengan persyaratan lowongan, bukan peluang diterima.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup perbandingan"
            className="p-stack-xs rounded-lg text-sb-text-2 hover:text-sb-navy hover:bg-sb-mist-soft transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-20 bg-white">
              <tr>
                <th className="sticky left-0 z-30 bg-white px-stack-md py-stack-md w-40 min-w-40">
                  <span className="sr-only">Faktor</span>
                </th>
                {jobs.map((job) => (
                  <th key={job.id} scope="col" className="px-stack-md py-stack-md min-w-[15rem] align-top font-normal">
                    <p className="text-base font-bold text-sb-navy leading-snug">{job.title}</p>
                    <p className="text-sm font-semibold text-sb-blue mt-stack-3xs">{job.company}</p>
                    <p className="text-xs text-sb-text-2 mt-stack-3xs">{job.location}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="Kecocokan CV">
                {jobs.map((job) => (
                  <td key={job.id} className="px-stack-md py-stack-md">
                    <MatchScore status={job.matchStatus} reason={job.matchStatusReason} score={job.matchScore} size="lg" />
                    {bestScore !== null && job.matchScore === bestScore && (
                      <span className="mt-stack-xs inline-block text-xs font-semibold text-sb-good">Paling cocok</span>
                    )}
                  </td>
                ))}
              </Row>

              <Row label="Skill yang cocok">
                {jobs.map((job) => (
                  <td key={job.id} className="px-stack-md py-stack-md">
                    {job.matchedSkills && job.matchedSkills.length > 0 ? (
                      <ul className="flex flex-wrap gap-stack-2xs">
                        {job.matchedSkills.map((s) => (
                          <li key={s} className="inline-flex items-center gap-stack-2xs px-stack-xs py-stack-2xs rounded-full bg-sb-good-soft text-sb-navy border border-sb-good/25 text-xs font-medium">
                            <Check className="w-3.5 h-3.5 text-sb-good" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sb-text-2">Belum ada skill yang cocok</span>
                    )}
                  </td>
                ))}
              </Row>

              <Row label="Skill belum ditemukan" hint="Ada di lowongan, belum terlihat di CV">
                {jobs.map((job) => (
                  <td key={job.id} className="px-stack-md py-stack-md">
                    {job.missingSkills && job.missingSkills.length > 0 ? (
                      <ul className="flex flex-wrap gap-stack-2xs">
                        {job.missingSkills.map((s) => (
                          <li key={s} className="inline-flex items-center gap-stack-2xs px-stack-xs py-stack-2xs rounded-full bg-white text-sb-navy border border-dashed border-sb-warning/60 text-xs font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 text-sb-warning" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sb-good font-semibold">Semua skill wajib sudah tercantum</span>
                    )}
                  </td>
                ))}
              </Row>

              <Row label="Prioritas">
                {jobs.map((job) => (
                  <td key={job.id} className="px-stack-md py-stack-md">
                    <PriorityStars value={job.priority} readOnly size="md" />
                    <span className="sr-only">{job.priority} dari 5</span>
                  </td>
                ))}
              </Row>

              <Row label="Tahapan">
                {jobs.map((job) => {
                  const stageConf = STAGE_CONFIG[job.stage] || STAGE_CONFIG.bookmarked;
                  return (
                    <td key={job.id} className="px-stack-md py-stack-md">
                      <select
                        value={job.stage}
                        aria-label={`Tahapan ${job.title}`}
                        onChange={(e) => onUpdateStage(job.id, e.target.value as TrackedJob["stage"])}
                        className={`py-stack-2xs pl-stack-sm pr-stack-2xl rounded-full border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sb-blue ${stageConf.badgeClass}`}
                      >
                        {STAGE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </Row>

              <Row label="Ekspektasi gaji">
                {jobs.map((job) => (
                  <td key={job.id} className="px-stack-md py-stack-md text-sb-navy">
                    {job.salaryExpectation && job.salaryExpectation !== "Kompensasi Kompetitif" ? job.salaryExpectation : <span className="text-sb-text-2">Belum diisi</span>}
                  </td>
                ))}
              </Row>

              <Row label="Timeline">
                {jobs.map((job) => (
                  <td key={job.id} className="px-stack-md py-stack-md text-sb-navy space-y-stack-2xs">
                    <p><span className="text-sb-text-2">Disimpan:</span> {job.dateSaved || "-"}</p>
                    {job.dateApplied && <p><span className="text-sb-text-2">Dilamar:</span> {job.dateApplied}</p>}
                    {job.interviewDate && <p><span className="text-sb-text-2">Wawancara:</span> {job.interviewDate}</p>}
                  </td>
                ))}
              </Row>

              <Row label="Catatan">
                {jobs.map((job) => (
                  <td key={job.id} className="px-stack-md py-stack-md text-sb-navy whitespace-pre-line">
                    {job.notes || <span className="text-sb-text-2">Belum ada catatan</span>}
                  </td>
                ))}
              </Row>

              <Row label="Detail">
                {jobs.map((job) => (
                  <td key={job.id} className="px-stack-md py-stack-md">
                    {!job.id.startsWith("custom_") ? (
                      <a
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center gap-stack-2xs text-sm font-semibold text-sb-blue hover:underline"
                      >
                        Lihat lowongan <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-sb-text-2">Ditambahkan sendiri</span>
                    )}
                  </td>
                ))}
              </Row>
            </tbody>
          </table>
        </div>

        <div className="px-stack-lg sm:px-stack-xl py-stack-sm border-t border-sb-border flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
