import React from "react";
import Link from "next/link";
import { Clock, Calendar, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { MatchBadge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { PriorityStars } from "@/components/tracker/priority-stars";
import { TrackedJob, JobStage, STAGE_CONFIG } from "@/types/tracker";
import { cn } from "@/lib/utils";

export interface TrackerTableProps {
  jobs: TrackedJob[];
  totalItems: number;
  selectedJobIds: Set<string>;
  onToggleSelectJob: (id: string) => void;
  onToggleSelectAll: () => void;
  onStageChange: (id: string, stage: JobStage) => void;
  onPriorityChange: (id: string, priority: number) => void;
  onEditJob: (job: TrackedJob) => void;
  onDeleteJob: (id: string) => void;
  isPending?: boolean;
  currentPage: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
}

export function TrackerTable({
  jobs,
  totalItems,
  selectedJobIds,
  onToggleSelectJob,
  onToggleSelectAll,
  onStageChange,
  onPriorityChange,
  onEditJob,
  onDeleteJob,
  isPending = false,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TrackerTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedJobIds.size === jobs.length && jobs.length > 0}
                  onChange={onToggleSelectAll}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  title="Pilih Semua di Halaman Ini"
                />
              </th>
              <th className="py-3 px-4 min-w-[200px]">Posisi & Perusahaan</th>
              <th className="py-3 px-3">Kecocokan CV</th>
              <th className="py-3 px-3 min-w-[130px]">Tahapan Lamaran</th>
              <th className="py-3 px-3 min-w-[130px]">Prioritas Minat</th>
              <th className="py-3 px-3">Ekspektasi Gaji</th>
              <th className="py-3 px-3 min-w-[120px]">Timeline & Catatan</th>
              <th className="py-3 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody
            className={cn(
              "divide-y divide-slate-100 transition-opacity duration-150",
              isPending ? "opacity-40" : "opacity-100"
            )}
          >
            {jobs.map((job) => {
              const isSelected = selectedJobIds.has(job.id);
              const stageConf = STAGE_CONFIG[job.stage] || STAGE_CONFIG.bookmarked;

              return (
                <tr
                  key={job.id}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    isSelected ? "bg-indigo-50/40" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-3.5 px-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectJob(job.id)}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* Title & Company */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <Link
                        href={job.id.startsWith("custom_") ? "#" : `/jobs/${job.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 hover:underline line-clamp-1"
                      >
                        {job.title}
                      </Link>
                      <p className="text-slate-600 font-medium">{job.company}</p>
                      <p className="text-[11px] text-slate-400">
                        {job.location} • {job.employmentType}
                      </p>
                    </div>
                  </td>

                  {/* Match Badge */}
                  <td className="py-3.5 px-3">
                    <MatchBadge status={job.matchStatus} score={job.matchScore} />
                  </td>

                  {/* Stage Selector */}
                  <td className="py-3.5 px-3">
                    <select
                      value={job.stage}
                      onChange={(e) => onStageChange(job.id, e.target.value as JobStage)}
                      className={`w-full py-1 px-2 rounded-lg border text-xs font-bold focus:outline-hidden ${stageConf.badgeClass}`}
                    >
                      <option value="bookmarked">Tersimpan</option>
                      <option value="applying">Siapkan Berkas</option>
                      <option value="applied">Sudah Melamar</option>
                      <option value="interviewing">Wawancara</option>
                      <option value="offered">Penawaran</option>
                      <option value="accepted">Diterima</option>
                      <option value="rejected">Ditolak</option>
                    </select>
                  </td>

                  {/* Priority Stars (1-5) */}
                  <td className="py-3.5 px-3">
                    <div className="space-y-1">
                      <PriorityStars
                        value={job.priority}
                        onChange={(newVal) => onPriorityChange(job.id, newVal)}
                      />
                      <span className="block text-[10px] text-slate-400 font-medium">
                        Level {job.priority}/5
                      </span>
                    </div>
                  </td>

                  {/* Salary */}
                  <td className="py-3.5 px-3 font-semibold text-slate-800">
                    {job.salaryExpectation || "Kompensasi Kompetitif"}
                  </td>

                  {/* Timeline & Notes */}
                  <td className="py-3.5 px-3">
                    <div className="space-y-1 text-[11px]">
                      {job.dateApplied && (
                        <p className="text-blue-600 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Dilamar: {job.dateApplied}
                        </p>
                      )}
                      {job.interviewDate && (
                        <p className="text-indigo-600 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {job.interviewDate}
                        </p>
                      )}
                      {job.notes ? (
                        <p className="text-slate-500 italic line-clamp-1 max-w-[150px]">
                          &ldquo;{job.notes}&rdquo;
                        </p>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {job.sourceUrl && (
                        <a
                          href={job.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="Buka Lowongan di Situs Asli"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditJob(job)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Catatan & Jadwal"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteJob(job.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus dari Pelacakan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          itemLabel="lowongan"
        />
      </div>
    </div>
  );
}

