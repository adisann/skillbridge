import React from "react";
import Link from "next/link";
import { Clock, Calendar, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { MatchScore } from "@/components/tracker/match-score";
import { Pagination } from "@/components/ui/pagination";
import { PriorityStars } from "@/components/tracker/priority-stars";
import { TrackedJob, JobStage, STAGE_CONFIG } from "@/types/tracker";
import { cn } from "@/lib/utils";

interface TrackerTableProps {
  jobs: TrackedJob[];
  totalItems: number;
  /** Kolom pilih hanya muncul saat mode "Bandingkan lowongan" aktif. */
  selectMode: boolean;
  selectedJobIds: Set<string>;
  onToggleSelectJob: (id: string) => void;
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
  selectMode,
  selectedJobIds,
  onToggleSelectJob,
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
    <div className="glass-panel rounded-2xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-sb-border bg-white/60 text-sb-text-2 font-bold uppercase tracking-wider">
              {selectMode && (
                <th className="py-stack-sm px-stack-sm w-12 text-center">
                  <span className="sr-only">Pilih untuk dibandingkan</span>
                </th>
              )}
              <th className="py-stack-sm px-stack-md min-w-[200px]">Posisi & Perusahaan</th>
              <th className="py-stack-sm px-stack-sm">Kecocokan CV</th>
              <th className="py-stack-sm px-stack-sm min-w-[130px]">Tahapan Lamaran</th>
              <th className="py-stack-sm px-stack-sm min-w-[130px]">Prioritas Minat</th>
              <th className="py-stack-sm px-stack-sm">Ekspektasi Gaji</th>
              <th className="py-stack-sm px-stack-sm min-w-[120px]">Timeline & Catatan</th>
              <th className="py-stack-sm px-stack-sm text-right">Aksi</th>
            </tr>
          </thead>
          <tbody
            className={cn(
              "divide-y divide-sb-border transition-opacity duration-150",
              isPending ? "opacity-40" : "opacity-100"
            )}
          >
            {jobs.map((job) => {
              const isSelected = selectedJobIds.has(job.id);
              const stageConf = STAGE_CONFIG[job.stage] || STAGE_CONFIG.bookmarked;

              return (
                <tr
                  key={job.id}
                  onClick={selectMode ? () => onToggleSelectJob(job.id) : undefined}
                  className={cn(
                    "transition-colors",
                    selectMode && "cursor-pointer",
                    selectMode && isSelected ? "bg-sb-mist-soft" : "bg-white/40 hover:bg-white/80"
                  )}
                >
                  {selectMode && (
                    <td className="py-stack-sm px-stack-sm text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => onToggleSelectJob(job.id)}
                        aria-label={`Pilih ${job.title} untuk dibandingkan`}
                        className="w-4 h-4 rounded text-sb-blue focus:ring-sb-blue cursor-pointer"
                      />
                    </td>
                  )}

                  {/* Title & Company */}
                  <td className="py-stack-sm px-stack-md">
                    <div className="space-y-stack-3xs">
                      <Link
                        href={job.id.startsWith("custom_") ? "#" : `/jobs/${job.id}`}
                        className="font-bold text-sb-navy hover:text-sb-blue hover:underline line-clamp-1"
                      >
                        {job.title}
                      </Link>
                      <p className="text-sb-text-2 font-medium">{job.company}</p>
                      <p className="text-[11px] text-sb-text-2">
                        {job.location} • {job.employmentType}
                      </p>
                    </div>
                  </td>

                  {/* Match Badge */}
                  <td className="py-stack-sm px-stack-sm">
                    <MatchScore status={job.matchStatus} score={job.matchScore} />
                  </td>

                  {/* Stage Selector */}
                  <td className="py-stack-sm px-stack-sm">
                    <select
                      value={job.stage}
                      onChange={(e) => onStageChange(job.id, e.target.value as JobStage)}
                      className={`w-full py-stack-2xs px-stack-xs rounded-full border text-xs font-bold focus:outline-hidden ${stageConf.badgeClass}`}
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
                  <td className="py-stack-sm px-stack-sm">
                    <div className="space-y-stack-2xs">
                      <PriorityStars
                        value={job.priority}
                        onChange={(newVal) => onPriorityChange(job.id, newVal)}
                      />
                      <span className="block text-xs text-sb-text-2 font-medium font-mono-metric">
                        Level {job.priority}/5
                      </span>
                    </div>
                  </td>

                  {/* Salary */}
                  <td className="py-stack-sm px-stack-sm font-semibold text-sb-navy">
                    {job.salaryExpectation && job.salaryExpectation !== "Kompensasi Kompetitif" ? job.salaryExpectation : <span className="font-normal text-sb-text-2">Belum diisi</span>}
                  </td>

                  {/* Timeline & Notes */}
                  <td className="py-stack-sm px-stack-sm">
                    <div className="space-y-stack-2xs text-[11px]">
                      {job.dateApplied && (
                        <p className="text-sb-blue font-semibold flex items-center gap-stack-2xs font-mono-metric">
                          <Clock className="w-3 h-3" /> Dilamar: {job.dateApplied}
                        </p>
                      )}
                      {job.interviewDate && (
                        <p className="text-sb-warning font-semibold flex items-center gap-stack-2xs font-mono-metric">
                          <Calendar className="w-3 h-3" /> {job.interviewDate}
                        </p>
                      )}
                      {job.notes ? (
                        <p className="text-sb-text-2 italic line-clamp-1 max-w-[150px]">
                          &ldquo;{job.notes}&rdquo;
                        </p>
                      ) : (
                        <span className="text-sb-text-2">-</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-stack-sm px-stack-sm text-right">
                    <div className="flex items-center justify-end gap-stack-2xs">
                      <button
                        type="button"
                        onClick={() => onEditJob(job)}
                        className="p-stack-2xs rounded-lg text-sb-text-2 hover:text-sb-blue hover:bg-sb-mist-soft transition-colors"
                        title="Edit catatan atau rincian"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteJob(job.id)}
                        className="p-stack-2xs rounded-lg text-sb-text-2 hover:text-sb-critical hover:bg-sb-critical/10 transition-colors"
                        title="Hapus dari pelacakan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {!job.id.startsWith("custom_") && (
                        <Link
                          href={`/jobs/${job.id}`}
                          className="p-stack-2xs rounded-lg text-sb-text-2 hover:text-sb-blue hover:bg-sb-mist-soft transition-colors"
                          title="Lihat detail lowongan"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50]}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        className="px-stack-md sm:px-stack-lg py-stack-sm bg-white/50"
      />
    </div>
  );
}
