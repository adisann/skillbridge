"use client";

import React from "react";
import { X, ExternalLink, Check, AlertTriangle } from "lucide-react";
import { TrackedJob, STAGE_CONFIG } from "@/types/tracker";
import { MatchBadge } from "@/components/ui/badge";
import { PriorityStars } from "./priority-stars";
import { Button } from "@/components/ui/button";

interface JobComparisonModalProps {
  jobs: TrackedJob[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateStage: (jobId: string, newStage: TrackedJob["stage"]) => void;
}

export function JobComparisonModal({
  jobs,
  isOpen,
  onClose,
  onUpdateStage,
}: JobComparisonModalProps) {
  if (!isOpen || jobs.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="glass-panel bg-white/95 rounded-2xl max-w-5xl w-full shadow-2xl border border-sb-border overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="p-6 border-b border-sb-border flex items-center justify-between bg-white/70">
          <div>
            <h3 className="text-lg font-bold text-sb-navy">
              Perbandingan Komparatif Lowongan Target ({jobs.length} Posisi)
            </h3>
            <p className="text-xs text-sb-text-2 mt-0.5">
              Bandingkan lowongan secara berdampingan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-sb-text-2 hover:text-sb-navy hover:bg-sb-mist-soft transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid Table */}
        <div className="overflow-x-auto flex-1 p-6">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-sb-border">
                <th className="py-3 px-4 text-xs font-bold text-sb-text-2 uppercase tracking-wider w-44 bg-sb-mist-faint">
                  Faktor Evaluasi
                </th>
                {jobs.map((job) => (
                  <th key={job.id} className="py-3 px-4 min-w-[260px] align-top">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-sb-navy leading-snug">{job.title}</h4>
                      <p className="text-xs font-semibold text-sb-blue">{job.company}</p>
                      <p className="text-[11px] text-sb-text-2">{job.location}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sb-border text-xs">
              {/* Row 1: Match Score & Status */}
              <tr className="hover:bg-sb-mist-soft/40">
                <td className="py-3.5 px-4 font-bold text-sb-navy bg-sb-mist-faint">
                  Kecocokan CV
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <MatchBadge status={job.matchStatus} score={job.matchScore} />
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 2: Priority & Excitement Level */}
              <tr className="hover:bg-sb-mist-soft/40">
                <td className="py-3.5 px-4 font-bold text-sb-navy bg-sb-mist-faint">
                  Tingkat Prioritas (Minat)
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3.5 px-4">
                    <div className="space-y-1">
                      <PriorityStars value={job.priority} readOnly size="md" />
                      <span className="block text-xs text-sb-text-2 font-semibold font-mono-metric">
                        Rating {job.priority}/5 Bintang
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 3: Stage / Status Lamaran */}
              <tr className="hover:bg-sb-mist-soft/40">
                <td className="py-3.5 px-4 font-bold text-sb-navy bg-sb-mist-faint">
                  Tahapan Saat Ini
                </td>
                {jobs.map((job) => {
                  const stageConf = STAGE_CONFIG[job.stage] || STAGE_CONFIG.bookmarked;
                  return (
                    <td key={job.id} className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${stageConf.badgeClass}`}
                      >
                        {stageConf.label}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Row 4: Skill yang Cocok */}
              <tr className="hover:bg-sb-mist-soft/40">
                <td className="py-3.5 px-4 font-bold text-sb-navy bg-sb-mist-faint">
                  Keahlian Terpenuhi (CV)
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {job.matchedSkills && job.matchedSkills.length > 0 ? (
                        job.matchedSkills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sb-good/10 text-sb-good border border-sb-good/30 text-[11px] font-semibold"
                          >
                            <Check className="w-3 h-3 text-sb-good" />
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-sb-text-2 italic">Belum ada skill ditemukan</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 5: Skill Gap */}
              <tr className="hover:bg-sb-mist-soft/40">
                <td className="py-3.5 px-4 font-bold text-sb-navy bg-sb-mist-faint">
                  Keahlian Belum Ditemukan (Gap)
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {job.missingSkills && job.missingSkills.length > 0 ? (
                        job.missingSkills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sb-mist-faint text-sb-text-2 border border-sb-border text-[11px] font-medium"
                          >
                            <AlertTriangle className="w-3 h-3 text-sb-warning" />
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-sb-good font-semibold text-[11px]">
                          Seluruh persyaratan wajib terpenuhi!
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 6: Ekspektasi Kompensasi */}
              <tr className="hover:bg-sb-mist-soft/40">
                <td className="py-3.5 px-4 font-bold text-sb-navy bg-sb-mist-faint">
                  Ekspektasi Kompensasi
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3.5 px-4 font-semibold text-sb-navy">
                    {job.salaryExpectation || "Kompensasi Kompetitif"}
                  </td>
                ))}
              </tr>

              {/* Row 7: Tanggal Simpan & Tanggal Lamar */}
              <tr className="hover:bg-sb-mist-soft/40">
                <td className="py-3.5 px-4 font-bold text-sb-navy bg-sb-mist-faint">
                  Timeline Lamaran
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3.5 px-4 text-sb-text-2 space-y-0.5 font-mono-metric">
                    <p>Disimpan: {job.dateSaved || "-"}</p>
                    {job.dateApplied && <p className="text-sb-blue font-semibold">Dilamar: {job.dateApplied}</p>}
                    {job.interviewDate && (
                      <p className="text-sb-warning font-semibold">Wawancara: {job.interviewDate}</p>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 8: Catatan Pengguna */}
              <tr className="hover:bg-sb-mist-soft/40">
                <td className="py-3.5 px-4 font-bold text-sb-navy bg-sb-mist-faint">
                  Catatan Pribadi
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3.5 px-4 text-sb-text-2 italic">
                    {job.notes || "Belum ada catatan khusus."}
                  </td>
                ))}
              </tr>

              {/* Row 9: Aksi Cepat */}
              <tr>
                <td className="py-4 px-4 font-bold text-sb-navy bg-sb-mist-faint">
                  Aksi & Tautan
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-4 px-4">
                    <div className="space-y-2">
                      <select
                        value={job.stage}
                        onChange={(e) =>
                          onUpdateStage(job.id, e.target.value as TrackedJob["stage"])
                        }
                        className="w-full py-1 px-2.5 rounded-full border border-sb-border text-xs font-semibold bg-white text-sb-navy focus:outline-hidden"
                      >
                        <option value="bookmarked">Tersimpan</option>
                        <option value="applying">Siapkan Berkas</option>
                        <option value="applied">Sudah Melamar</option>
                        <option value="interviewing">Wawancara</option>
                        <option value="offered">Penawaran</option>
                        <option value="accepted">Diterima</option>
                        <option value="rejected">Ditolak</option>
                      </select>

                      {!job.id.startsWith("custom_") && (
                        <a
                          href={`/jobs/${job.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 w-full py-1 px-2.5 rounded-full text-xs font-semibold text-sb-blue bg-sb-mist-faint hover:bg-sb-mist-soft transition-colors"
                        >
                          Lihat Detail Lowongan <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-sb-border flex justify-end bg-white/70">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup Perbandingan
          </Button>
        </div>
      </div>
    </div>
  );
}


