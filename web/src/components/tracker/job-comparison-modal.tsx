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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Perbandingan Komparatif Lowongan Target ({jobs.length} Posisi)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tinjau kesesuaian kualifikasi, prioritas minat, dan estimasi kompensasi secara berdampingan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid Table */}
        <div className="overflow-x-auto flex-1 p-6">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-44 bg-slate-50/50">
                  Faktor Evaluasi
                </th>
                {jobs.map((job) => (
                  <th key={job.id} className="py-3 px-4 min-w-[260px] align-top">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{job.title}</h4>
                      <p className="text-xs font-semibold text-blue-600">{job.company}</p>
                      <p className="text-[11px] text-slate-500">{job.location}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {/* Row 1: Match Score & Status */}
              <tr className="hover:bg-slate-50/40">
                <td className="py-3.5 px-4 font-bold text-slate-700 bg-slate-50/50">
                  Kecocokan CV (AI)
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
              <tr className="hover:bg-slate-50/40">
                <td className="py-3.5 px-4 font-bold text-slate-700 bg-slate-50/50">
                  Tingkat Prioritas (Minat)
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3.5 px-4">
                    <div className="space-y-1">
                      <PriorityStars value={job.priority} readOnly size="md" />
                      <span className="block text-[10px] text-slate-500 font-semibold">
                        Rating {job.priority}/5 Bintang
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 3: Stage / Status Lamaran */}
              <tr className="hover:bg-slate-50/40">
                <td className="py-3.5 px-4 font-bold text-slate-700 bg-slate-50/50">
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
              <tr className="hover:bg-slate-50/40">
                <td className="py-3.5 px-4 font-bold text-slate-700 bg-slate-50/50">
                  Keahlian Terpenuhi (CV)
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {job.matchedSkills && job.matchedSkills.length > 0 ? (
                        job.matchedSkills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Belum ada skill terverifikasi</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 5: Skill Gap */}
              <tr className="hover:bg-slate-50/40">
                <td className="py-3.5 px-4 font-bold text-slate-700 bg-slate-50/50">
                  Keahlian Belum Ditemukan (Gap)
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {job.missingSkills && job.missingSkills.length > 0 ? (
                        job.missingSkills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px]">
                          Seluruh persyaratan wajib terpenuhi!
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 6: Ekspektasi Kompensasi */}
              <tr className="hover:bg-slate-50/40">
                <td className="py-3.5 px-4 font-bold text-slate-700 bg-slate-50/50">
                  Ekspektasi Kompensasi
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3.5 px-4 font-semibold text-slate-800">
                    {job.salaryExpectation || "Kompensasi Kompetitif"}
                  </td>
                ))}
              </tr>

              {/* Row 7: Tanggal Simpan & Tanggal Lamar */}
              <tr className="hover:bg-slate-50/40">
                <td className="py-3.5 px-4 font-bold text-slate-700 bg-slate-50/50">
                  Timeline Lamaran
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3.5 px-4 text-slate-600 space-y-0.5">
                    <p>Disimpan: {job.dateSaved || "-"}</p>
                    {job.dateApplied && <p className="text-blue-600 font-semibold">Dilamar: {job.dateApplied}</p>}
                    {job.interviewDate && (
                      <p className="text-indigo-600 font-semibold">Wawancara: {job.interviewDate}</p>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 8: Catatan Pengguna */}
              <tr className="hover:bg-slate-50/40">
                <td className="py-3.5 px-4 font-bold text-slate-700 bg-slate-50/50">
                  Catatan Pribadi
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3.5 px-4 text-slate-600 italic">
                    {job.notes || "Belum ada catatan khusus."}
                  </td>
                ))}
              </tr>

              {/* Row 9: Aksi Cepat */}
              <tr className="bg-slate-50/30">
                <td className="py-4 px-4 font-bold text-slate-700 bg-slate-50/50">Tindakan</td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-4 px-4">
                    <div className="flex flex-col gap-2">
                      {job.sourceUrl && job.sourceUrl.trim() !== "" ? (
                        <a
                          href={job.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs"
                        >
                          Lamar Lowongan
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Tautan web tidak tersedia</span>
                      )}

                      <select
                        value={job.stage}
                        onChange={(e) => onUpdateStage(job.id, e.target.value as TrackedJob["stage"])}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="bookmarked">Tersimpan</option>
                        <option value="applying">Siapkan Berkas</option>
                        <option value="applied">Sudah Melamar</option>
                        <option value="interviewing">Wawancara</option>
                        <option value="offered">Negosiasi / Offer</option>
                        <option value="accepted">Diterima</option>
                        <option value="rejected">Belum Berhasil</option>
                      </select>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Perbandingan berdasarkan algoritma pencocokan semantik & taksonomi keahlian SkillBridge.
          </p>
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup Perbandingan
          </Button>
        </div>
      </div>
    </div>
  );
}
