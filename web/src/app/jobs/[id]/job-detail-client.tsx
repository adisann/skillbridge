"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  MinusCircle,
  HelpCircle,
  CalendarClock,
  Briefcase,
  Layers,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MatchBadge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/supabase/auth-context";
import { JobChatAssistant } from "@/components/jobs/job-chat-assistant";
import { fetchDeduped } from "@/lib/fetcher";

export interface RequirementEvaluation {
  id: string;
  skill: string;
  isMandatory: boolean;
  status: "cocok" | "belum_ditemukan" | "belum_cukup_bukti";
  statusLabel: string;
  evidence: string;
}

interface JobDetailData {
  id: string;
  title: string;
  canonicalTitle: string;
  company: string;
  location: string;
  employmentType: string;
  seniority: string;
  sourceName: string;
  sourceUrl: string;
  retrievalMethod: string;
  retrievedAt?: string;
  expiresAt?: string;
  deadline?: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  matchScore: number | null;
  matchStatus: "match" | "underqualified" | "potentially_overqualified" | "insufficient_evidence";
  matchedSkills: string[];
  missingSkills: string[];
  unprovenSkills?: string[];
  factorsSupporting: string[];
  factorsLimiting: string[];
  scoreBreakdown: Array<{ label: string; score: number; weight: number }>;
  requirementsEvaluation?: RequirementEvaluation[];
}

function formatDeadlineDate(deadlineStr?: string, fallbackFrom?: string): string {
  if (deadlineStr) {
    const d = new Date(deadlineStr);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
    }
  }
  if (fallbackFrom) {
    const fromDate = new Date(fallbackFrom);
    if (!isNaN(fromDate.getTime())) {
      const d = new Date(fromDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
    }
  }
  return "30 Nov 2026";
}

export default function JobDetailClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState<JobDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const jobId = resolvedParams?.id;

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true);
      try {
        const [savedData, detailData] = await Promise.all([
          fetchDeduped<{ savedJobIds?: string[] }>("/api/saved-jobs").catch(() => ({ savedJobIds: [] as string[] })),
          fetchDeduped<{ job?: JobDetailData; error?: string }>(`/api/jobs/${jobId}`),
        ]);

        if (jobId && savedData.savedJobIds && savedData.savedJobIds.includes(jobId)) {
          setIsSaved(true);
        }

        if (detailData.job) {
          setJob(detailData.job);
        }
      } catch (err) {
        console.error("Gagal memuat detail lowongan:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleToggleSave = async () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      await fetchDeduped("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
    } catch (e) {
      console.warn("Gagal update simpanan:", e);
      setIsSaved(!nextSaved);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState
          title="Detail Lowongan Tidak Ditemukan"
          description="Lowongan dengan ID tersebut tidak ditemukan pada database."
          actionLabel="Kembali ke Cari Lowongan"
          onAction={() => router.push("/jobs")}
        />
      </div>
    );
  }

  const allReqs: RequirementEvaluation[] =
    job.requirementsEvaluation && job.requirementsEvaluation.length > 0
      ? job.requirementsEvaluation
      : [
          ...(job.requiredSkills || []).map((s, idx) => {
            const isCocok = (job.matchedSkills || []).includes(s);
            const isUnproven = (job.unprovenSkills || []).includes(s);
            const status: "cocok" | "belum_cukup_bukti" | "belum_ditemukan" = isCocok
              ? "cocok"
              : isUnproven
              ? "belum_cukup_bukti"
              : "belum_ditemukan";
            return {
              id: `req-m-${idx}`,
              skill: s,
              isMandatory: true,
              status,
              statusLabel:
                status === "cocok"
                  ? "Cocok di CV"
                  : status === "belum_cukup_bukti"
                  ? "Belum cukup bukti"
                  : "Belum ditemukan di CV",
              evidence:
                status === "cocok"
                  ? "Tercantum pada kualifikasi CV-mu."
                  : status === "belum_cukup_bukti"
                  ? "CV-mu memuat keahlian serumpun, namun belum ada rincian bukti spesifik."
                  : "Belum ada di CV-mu",
            };
          }),
          ...(job.preferredSkills || []).map((s, idx) => {
            const isCocok = (job.matchedSkills || []).includes(s);
            const isUnproven = (job.unprovenSkills || []).includes(s);
            const status: "cocok" | "belum_cukup_bukti" | "belum_ditemukan" = isCocok
              ? "cocok"
              : isUnproven
              ? "belum_cukup_bukti"
              : "belum_ditemukan";
            return {
              id: `req-p-${idx}`,
              skill: s,
              isMandatory: false,
              status,
              statusLabel:
                status === "cocok"
                  ? "Cocok di CV"
                  : status === "belum_cukup_bukti"
                  ? "Belum cukup bukti"
                  : "Belum ditemukan di CV",
              evidence:
                status === "cocok"
                  ? "Tercantum pada kualifikasi CV-mu."
                  : status === "belum_cukup_bukti"
                  ? "Ditemukan kompetensi pendukung di CV-mu."
                  : "Belum ada di CV-mu",
            };
          }),
        ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Tombol Kembali */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/jobs")}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Cari Lowongan
        </button>
      </div>

      {/* Header Lowongan */}
      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 pt-1">
                <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-slate-500" />
                  Tipe: {job.employmentType}
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <CalendarClock className="w-4 h-4 text-amber-600" />
                  Deadline:{" "}
                  <span className="text-slate-900 font-semibold">
                    {formatDeadlineDate(job.deadline || job.expiresAt, job.retrievedAt)}
                  </span>
                </span>
              </div>
            </div>

            {/* Score & Status Badge */}
            <div className="flex flex-col sm:items-end shrink-0">
              <MatchBadge status={job.matchStatus} score={job.matchScore} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
            {job.sourceUrl && job.sourceUrl.trim() !== "" ? (
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={async () => {
                  if (!isSaved) {
                    await handleToggleSave();
                  }
                }}
                className="inline-flex"
              >
                <Button variant="primary" size="md" rightIcon={<ExternalLink className="w-4 h-4" />}>
                  Lamar Sekarang
                </Button>
              </a>
            ) : (
              <div className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600 border border-slate-200">
                Kontak lamaran tertera di deskripsi
              </div>
            )}

            <Button
              variant="outline"
              size="md"
              onClick={handleToggleSave}
              leftIcon={<Bookmark className={`w-4 h-4 ${isSaved ? "fill-blue-600 text-blue-600" : ""}`} />}
            >
              {isSaved ? "Tersimpan di Pelacakan" : "Simpan Lowongan"}
            </Button>

            {isSaved && (
              <button
                type="button"
                onClick={() => router.push("/tracker")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-amber-900 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
              >
                <Layers className="w-4 h-4 text-amber-600" />
                Atur Pipeline di Tracker
              </button>
            )}

            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsChatOpen(true)}
              leftIcon={<MessageSquare className="w-4 h-4 text-blue-600" />}
            >
              Tanya Asisten AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rincian Komponen Skor */}
      <Card>
        <CardHeader>
          <CardTitle>Rincian Transparan Skor Kecocokan</CardTitle>
          <CardDescription>
            Skor dihitung berdasarkan 5 komponen kualifikasi: skill wajib (35%), skill tambahan (20%), pengalaman kerja (15%), pendidikan & level (10%), dan kesesuaian semantik (20%).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {job.scoreBreakdown && job.scoreBreakdown.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {job.scoreBreakdown.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate mr-1">{item.label}</span>
                    <span className="text-slate-400 font-mono text-[11px] shrink-0">Bobot {item.weight}%</span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900">{item.score}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
              <p className="text-xs text-slate-600 font-medium">
                Belum ada skor kecocokan karena CV belum diunggah.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/cv")}
              >
                Unggah CV Sekarang
              </Button>
            </div>
          )}

          <p className="text-xs text-slate-500 pt-1">
            Skor menunjukkan kecocokan CV dengan persyaratan, bukan peluang diterima.
          </p>
        </CardContent>
      </Card>

      {/* Kualifikasi & Persyaratan */}
      <Card>
        <CardHeader>
          <CardTitle>Status Kualifikasi & Persyaratan</CardTitle>
          <CardDescription>
            Membedakan kualifikasi secara transparan menjadi <strong>Cocok</strong>, <strong>Belum Ditemukan</strong>, dan <strong>Belum Cukup Bukti</strong> di CV.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {allReqs.map((req) => (
            <div
              key={req.id}
              className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  {req.status === "cocok" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : req.status === "belum_cukup_bukti" ? (
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <MinusCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-900">{req.skill}</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {req.isMandatory ? "Wajib" : "Tambahan"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pl-6.5">
                  {req.evidence}
                </p>
              </div>

              <div className="sm:self-center shrink-0 pl-6.5 sm:pl-0">
                {req.status === "cocok" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Cocok di CV
                  </span>
                ) : req.status === "belum_cukup_bukti" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    Belum cukup bukti
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold bg-slate-50 text-slate-700 border border-slate-300">
                    <MinusCircle className="w-3.5 h-3.5 text-slate-500" />
                    Belum ditemukan di CV
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Faktor Pendukung & Pembatas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Faktor Pendukung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-700">
            {(job.factorsSupporting && job.factorsSupporting.length > 0
              ? job.factorsSupporting
              : ["Memenuhi kualifikasi skill utama yang disyaratkan"]
            ).map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{f}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Faktor Pembatas & Gap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-700">
            {(job.factorsLimiting && job.factorsLimiting.length > 0
              ? job.factorsLimiting
              : ["Seluruh kualifikasi wajib terpenuhi dengan baik"]
            ).map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>{f}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Deskripsi Lengkap Pekerjaan */}
      <Card>
        <CardHeader>
          <CardTitle>Deskripsi Pekerjaan Asli</CardTitle>
          <CardDescription>
            Kualifikasi dan tanggung jawab posisi yang dipublikasikan oleh pihak rekruter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
            {job.description}
          </div>
        </CardContent>
      </Card>

      {/* Floating AI Job Assistant (YOLO / Ultralytics Style Floating Modal & Trigger) */}
      <JobChatAssistant
        key={`${job.id}-${user?.id || "anon"}`}
        jobId={job.id}
        jobTitle={job.title}
        company={job.company}
        userId={user?.id}
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
      />
    </div>
  );
}
