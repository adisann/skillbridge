"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
import { ScoreRing } from "@/components/ui/score-ring";
import { SkeletonCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/supabase/auth-context";
import { JobChatAssistant } from "@/components/jobs/job-chat-assistant";
import { fetchDeduped } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/copy";

export interface RequirementEvaluation {
  id: string;
  skill: string;
  isMandatory: boolean;
  status: "cocok" | "belum_ditemukan" | "belum_cukup_bukti";
  statusLabel: string;
  evidence: string;
}

export interface JobDetailData {
  id: string;
  title: string;
  canonicalTitle: string;
  category?: string;
  categoryLabel?: string;
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
  scoreBreakdown: Array<{
    label: string;
    score: number;
    weight: number;
    available?: boolean;
    notes?: string;
  }>;
  requirementsEvaluation?: RequirementEvaluation[];
}

export interface JobDetailProps {
  jobId: string;
  mode?: "guest" | "user";
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

export function JobDetail({ jobId, mode = "user" }: JobDetailProps) {
  const isGuest = mode === "guest";
  const router = useRouter();
  const { user, loginDemoJuri } = useAuth();
  const [job, setJob] = useState<JobDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const fetches: [Promise<{ job?: JobDetailData }>, Promise<{ savedJobs?: Array<{ id: string }> }>] = [
          fetchDeduped<{ job?: JobDetailData }>(`/api/jobs/${jobId}`),
          !isGuest
            ? fetchDeduped<{ savedJobs?: Array<{ id: string }> }>("/api/saved-jobs").catch(() => ({ savedJobs: [] }))
            : Promise.resolve({ savedJobs: [] }),
        ];

        const [jobRes, savedRes] = await Promise.all(fetches);

        if (jobRes.job) {
          setJob(jobRes.job);
        } else {
          setErrorMsg("Data lowongan tidak ditemukan.");
        }

        if (savedRes.savedJobs && savedRes.savedJobs.some((s) => s.id === jobId)) {
          setIsSaved(true);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message || "Gagal memuat rincian lowongan.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [jobId, isGuest]);

  const handleToggleSave = async () => {
    if (isGuest) {
      router.push(`/login?next=${encodeURIComponent(`/lowongan/${jobId}`)}`);
      return;
    }

    const prev = isSaved;
    setIsSaved(!prev);
    try {
      await fetchDeduped("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
    } catch {
      setIsSaved(prev);
    }
  };

  const backUrl = isGuest ? "/lowongan" : "/jobs";

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-6 w-32 bg-sb-mist-soft animate-pulse rounded-md" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (errorMsg || !job) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          title={errorMsg || "Lowongan Tidak Ditemukan"}
          description="Lowongan mungkin telah kedaluwarsa atau URL yang dimasukkan salah."
          actionLabel="Kembali ke Daftar Lowongan"
          onAction={() => router.push(backUrl)}
        />
      </div>
    );
  }

  // Rekonstruksi evaluasi jika belum ada dari backend (hanya relevan untuk user login)
  const reqEvaluations: RequirementEvaluation[] =
    job.requirementsEvaluation && job.requirementsEvaluation.length > 0
      ? job.requirementsEvaluation
      : [
        ...job.requiredSkills.map((s, idx) => {
          const status: "cocok" | "belum_ditemukan" | "belum_cukup_bukti" =
            job.matchedSkills.includes(s)
              ? "cocok"
              : (job.unprovenSkills || []).includes(s)
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
                  ? "Ditemukan kompetensi pendukung di CV-mu."
                  : "Belum ada di CV-mu",
          };
        }),
        ...job.preferredSkills.map((s, idx) => {
          const status: "cocok" | "belum_ditemukan" | "belum_cukup_bukti" =
            job.matchedSkills.includes(s)
              ? "cocok"
              : (job.unprovenSkills || []).includes(s)
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 space-y-8">
      {/* Tombol Kembali */}
      <div>
        <Link
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sb-text-2 hover:text-sb-blue transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Lowongan</span>
        </Link>
      </div>

      {/* Header Lowongan */}
      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="px-3 py-1 rounded-full bg-sb-mist-soft text-sb-navy border border-sb-border text-xs font-bold">
                {job.canonicalTitle || job.title}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-sb-navy tracking-tight">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-sb-text-2 pt-1">
                <span className="flex items-center gap-1.5 font-bold text-sb-navy">
                  <Building2 className="w-4 h-4 text-sb-blue" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sb-blue" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-sb-blue" />
                  Tipe: {job.employmentType}
                </span>
                <span className="flex items-center gap-1.5 text-sb-text-2 font-medium">
                  <CalendarClock className="w-4 h-4 text-sb-warning" />
                  Deadline:{" "}
                  <span className="text-sb-navy font-bold">
                    {formatDeadlineDate(job.deadline || job.expiresAt, job.retrievedAt)}
                  </span>
                </span>
              </div>
            </div>

            {/* Score Ring & Status Badge (hanya untuk mode user login) */}
            {!isGuest && (
              <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                <ScoreRing score={job.matchScore} size="lg" />
                <MatchBadge status={job.matchStatus} score={job.matchScore} />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-sb-border">
            {job.sourceUrl && job.sourceUrl.trim() !== "" ? (
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={async () => {
                  if (!isSaved && !isGuest) {
                    await handleToggleSave();
                  }
                }}
                className="inline-flex"
              >
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<ExternalLink className="w-4 h-4 ml-1" />}
                  className="px-6"
                >
                  Lamar di Sumber Asli
                </Button>
              </a>
            ) : null}

            <Button
              variant="outline"
              size="md"
              onClick={handleToggleSave}
              leftIcon={
                <Bookmark
                  className={cn(
                    "w-4 h-4",
                    isSaved ? "fill-sb-blue text-sb-blue" : "text-sb-text-2"
                  )}
                />
              }
              className="px-5"
            >
              {isSaved ? "Tersimpan" : "Simpan Lowongan"}
            </Button>

            {!isGuest && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsChatOpen(true)}
                leftIcon={<MessageSquare className="w-4 h-4" />}
                className="px-5"
              >
                Tanya Asisten AI
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mode Tamu: Kartu Ajakan Masuk / Akun Demo */}
      {isGuest && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-sb-border bg-sb-mist-soft space-y-3">
          <h3 className="text-base font-extrabold text-sb-navy">
            Masuk untuk melihat skill mana yang sudah ada di CV-mu
          </h3>
          <p className="text-xs sm:text-sm text-sb-text-2 leading-relaxed max-w-2xl">
            Unggah CV atau gunakan akun demo juri untuk membandingkan kualifikasi secara otomatis dengan lowongan ini, melihat skor kecocokan, dan mendapatkan rekomendasi gap kompetensi.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={`/login?next=${encodeURIComponent(`/lowongan/${job.id}`)}`}>
              <Button variant="primary" size="md">
                Masuk
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="md"
              onClick={async () => {
                await loginDemoJuri();
                router.push(`/jobs/${job.id}`);
              }}
            >
              Coba akun demo
            </Button>
          </div>
        </div>
      )}

      {/* Mode Tamu: Kualifikasi Skill (Chip Netral) */}
      {isGuest && (
        <Card>
          <CardHeader>
            <CardTitle>Persyaratan Kualifikasi</CardTitle>
            <CardDescription>
              Daftar keahlian teknis dan kemampuan pendukung yang dipersyaratkan oleh perusahaan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sb-navy">
                  Skill Wajib ({job.requiredSkills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full bg-sb-mist-soft text-sb-navy border border-sb-border text-xs font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.preferredSkills && job.preferredSkills.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-sb-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sb-text-2">
                  Skill Tambahan ({job.preferredSkills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {job.preferredSkills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full bg-sb-mist-faint text-sb-navy border border-sb-border text-xs font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mode User Login: Rincian Skor & Evaluasi Kualifikasi CV */}
      {!isGuest && (
        <>
          {/* Breakdown Skor */}
          {job.scoreBreakdown && job.scoreBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-sb-blue" />
                    Rincian Komponen Skor
                  </CardTitle>
                  <p className="text-xs text-sb-text-2">
                    Skor menunjukkan kecocokan CV dengan persyaratan, bukan peluang diterima.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {job.scoreBreakdown.map((b) => {
                    const displayWeight = formatPercent(b.weight);
                    const displayScore = formatPercent(b.score);
                    const isAvailable = b.available ?? displayWeight > 0;
                    return (
                      <div
                        key={b.label}
                        className={cn(
                          "p-3.5 rounded-xl border border-sb-border space-y-1.5 transition-all",
                          isAvailable ? "bg-white/70" : "bg-sb-mist-faint/40 opacity-75"
                        )}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-sb-text-2">{b.label}</span>
                          <span
                            className={cn(
                              "text-[11px] font-mono-metric font-semibold",
                              isAvailable ? "text-sb-navy" : "text-sb-text-2/60"
                            )}
                          >
                            {isAvailable ? `${displayWeight}%` : "0% (N/A)"}
                          </span>
                        </div>
                        <div className="text-xl font-extrabold text-sb-navy font-mono-metric">
                          {isAvailable ? (
                            <>
                              {displayScore}
                              <span className="text-xs text-sb-text-2 font-normal">/100</span>
                            </>
                          ) : (
                            <span className="text-base font-semibold text-sb-text-2/60">—</span>
                          )}
                        </div>
                        <div className="w-full bg-sb-mist-soft rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-500",
                              isAvailable ? "bg-sb-sky" : "bg-sb-border"
                            )}
                            style={{
                              width: isAvailable ? `${displayScore}%` : "0%",
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-sb-text-2/70 truncate">
                          {isAvailable
                            ? b.notes || "Dievaluasi dari CV"
                            : "Tidak disyaratkan di lowongan"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evaluasi Persyaratan Wajib & Tambahan (cocok, belum ditemukan, belum cukup bukti) */}
          <Card>
            <CardHeader>
              <CardTitle>Analisis Persyaratan Kualifikasi</CardTitle>
              <CardDescription>
                Evaluasi otomatis kesesuaian antara kualifikasi lowongan dengan isi CV aktifmu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-sb-border text-sb-text-2 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3">Kualifikasi</th>
                      <th className="py-3 px-3">Tipe</th>
                      <th className="py-3 px-3">Status CV</th>
                      <th className="py-3 px-3">Bukti dari Dokumen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sb-border">
                    {reqEvaluations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-sb-text-2">
                          Tidak ada persyaratan keahlian teknis spesifik yang terdaftar untuk posisi ini.
                        </td>
                      </tr>
                    ) : (
                      reqEvaluations.map((req) => (
                        <tr key={req.id} className="hover:bg-sb-mist-faint/50 transition-colors">
                          <td className="py-3 px-3 font-bold text-sb-navy">{req.skill}</td>
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[11px] font-bold",
                                req.isMandatory
                                  ? "bg-sb-mist-soft text-sb-navy border border-sb-border"
                                  : "bg-white text-sb-text-2 border border-sb-border"
                              )}
                            >
                              {req.isMandatory ? "Wajib" : "Tambahan"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] border",
                                req.status === "cocok"
                                  ? "bg-emerald-50 text-sb-good border-emerald-200"
                                  : req.status === "belum_cukup_bukti"
                                    ? "bg-amber-50 text-sb-warning border-amber-200"
                                    : "bg-sb-mist-faint text-sb-text-2 border-sb-border"
                              )}
                            >
                              {req.status === "cocok" && <CheckCircle2 className="w-3.5 h-3.5 text-sb-good" />}
                              {req.status === "belum_cukup_bukti" && <HelpCircle className="w-3.5 h-3.5 text-sb-warning" />}
                              {req.status === "belum_ditemukan" && <MinusCircle className="w-3.5 h-3.5 text-sb-text-2" />}
                              {req.statusLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-sb-text-2 italic">{req.evidence}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Faktor Pendukung & Faktor Pembatas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sb-good flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sb-good" />
                  Faktor Pendukung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-sb-text-2">
                {(job.factorsSupporting && job.factorsSupporting.length > 0
                  ? job.factorsSupporting
                  : ["Memenuhi kualifikasi skill utama yang disyaratkan"]
                ).map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-sb-good font-bold">•</span>
                    <span>{f}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sb-warning flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-sb-warning" />
                  Faktor Pembatas & Gap
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-sb-text-2">
                {(job.factorsLimiting && job.factorsLimiting.length > 0
                  ? job.factorsLimiting
                  : ["Seluruh kualifikasi wajib terpenuhi dengan baik"]
                ).map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-sb-warning font-bold">•</span>
                    <span>{f}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Deskripsi Lengkap Pekerjaan */}
      <Card>
        <CardHeader>
          <CardTitle>Deskripsi Pekerjaan Asli</CardTitle>
          <CardDescription>
            Kualifikasi dan tanggung jawab posisi yang dipublikasikan oleh pihak rekruter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-sb-text-2 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
            {job.description}
          </div>
        </CardContent>
      </Card>

      {/* Floating AI Job Assistant (Hanya untuk pengguna login) */}
      {!isGuest && (
        <JobChatAssistant
          key={`${job.id}-${user?.id || "anon"}`}
          jobId={job.id}
          jobTitle={job.title}
          company={job.company}
          userId={user?.id}
          isOpen={isChatOpen}
          onOpenChange={setIsChatOpen}
        />
      )}
    </div>
  );
}

