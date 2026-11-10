import React from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { MatchScore } from "@/components/tracker/match-score";
import { PriorityStars } from "@/components/tracker/priority-stars";
import { TrackedJob, JobStage, STAGE_CONFIG } from "@/types/tracker";

interface TrackerBoardProps {
  jobs: TrackedJob[];
  onStageChange: (id: string, stage: JobStage) => void;
  onPriorityChange: (id: string, priority: number) => void;
  onEditJob: (job: TrackedJob) => void;
}

export function TrackerBoard({
  jobs,
  onStageChange,
  onPriorityChange,
  onEditJob,
}: TrackerBoardProps) {
  const KANBAN_STAGES: JobStage[] = [
    "bookmarked",
    "applying",
    "applied",
    "interviewing",
    "offered",
    "accepted",
    "rejected",
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
      {KANBAN_STAGES.map((stageKey) => {
        const stageConf = STAGE_CONFIG[stageKey];
        const stageJobs = jobs.filter((j) => j.stage === stageKey);

        return (
          <div
            key={stageKey}
            className="w-72 sm:w-80 shrink-0 rounded-2xl border border-sb-border bg-sb-mist-faint/50 p-3 flex flex-col space-y-3 min-h-[460px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sb-sky" />
                <h4 className="text-xs font-bold text-sb-navy uppercase tracking-wider">
                  {stageConf.label}
                </h4>
              </div>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-white text-sb-navy border border-sb-border">
                {stageJobs.length}
              </span>
            </div>

            {/* Cards inside Column */}
            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {stageJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl p-3.5 border border-sb-border shadow-2xs hover:shadow-xs transition-shadow space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={job.id.startsWith("custom_") ? "#" : `/jobs/${job.id}`}
                        className="font-bold text-xs text-sb-navy hover:text-sb-blue line-clamp-1"
                      >
                        {job.title}
                      </Link>
                      <p className="text-[11px] font-semibold text-sb-text-2">{job.company}</p>
                    </div>
                    <MatchScore status={job.matchStatus} score={job.matchScore} />
                  </div>

                  {/* Priority Rating */}
                  <div className="flex items-center justify-between pt-1 border-t border-sb-border">
                    <PriorityStars
                      value={job.priority}
                      size="sm"
                      onChange={(val) => onPriorityChange(job.id, val)}
                    />
                    <span className="text-xs text-sb-text-2 font-semibold">
                      {job.salaryExpectation ? job.salaryExpectation.slice(0, 15) : "Kompetitif"}
                    </span>
                  </div>

                  {/* Move stage action */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <select
                      value={job.stage}
                      onChange={(e) => onStageChange(job.id, e.target.value as JobStage)}
                      className="text-xs py-1 px-1.5 rounded-md border border-sb-border font-bold bg-sb-mist-soft text-sb-navy focus:outline-hidden"
                    >
                      <option value="bookmarked">Tersimpan</option>
                      <option value="applying">Siapkan Berkas</option>
                      <option value="applied">Sudah Melamar</option>
                      <option value="interviewing">Wawancara</option>
                      <option value="offered">Penawaran</option>
                      <option value="accepted">Diterima</option>
                      <option value="rejected">Belum Berhasil</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => onEditJob(job)}
                      className="text-sb-text-2 hover:text-sb-navy p-1 cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

