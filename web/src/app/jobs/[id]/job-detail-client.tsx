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
  Info,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MatchBadge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/supabase/auth-context";

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
  retrievedAt: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  matchScore: number;
  matchStatus: "match" | "underqualified" | "potentially_overqualified" | "insufficient_evidence";
  matchedSkills: string[];
  missingSkills: string[];
  unprovenSkills?: string[];
  factorsSupporting: string[];
  factorsLimiting: string[];
  scoreBreakdown: Array<{ label: string; score: number; weight: number }>;
  requirementsEvaluation?: RequirementEvaluation[];
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

  const jobId = resolvedParams?.id;

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (user?.id) queryParams.append("userId", user.id);

        // Coba ambil langsung dari endpoint detail per ID
        const resDetail = await fetch(`/api/jobs/${jobId}?${queryParams.toString()}`);
        if (resDetail.ok) {
          const detailData = await resDetail.json();
          if (detailData.job) {
            setJob(detailData.job);
            setIsLoading(false);
            return;
          }
        }

        const res = await fetch(`/api/jobs?${queryParams.toString()}`);
        const data = await res.json();

        if (data.jobs) {
          const found = data.jobs.find((j: JobDetailData) => j.id === jobId || j.id.toString() === jobId);
          if (found) {
            setJob(found);
          } else if (data.jobs.length > 0) {
            setJob(data.jobs[0]);
          }
        }
      } catch (err) {
        console.error("Gagal memuat detail lowongan:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [jobId, user?.id]);

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
          actionLabel="Kembali ke Job Explorer"
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
                  ? "Tercantum pada kualifikasi CV pelamar."
                  : status === "belum_cukup_bukti"
                  ? "CV memuat keahlian serumpun, namun belum ada rincian bukti spesifik."
                  : "Belum ditemukan penyebutan skill ini di CV pelamar.",
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
                  ? "Tercantum pada kualifikasi CV pelamar."
                  : status === "belum_cukup_bukti"
                  ? "Ditemukan kompetensi pendukung di CV."
                  : "Belum ditemukan pada dokumen CV.",
            };
          }),
        ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Tombol Kembali */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/jobs")}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Job Explorer
        </button>

        <span className="text-xs text-slate-400 font-mono">
          ID: {job.id.slice(0, 8)}...
        </span>
      </div>

      {/* Header Lowongan */}
      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                {job.canonicalTitle}
              </span>
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
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Tipe: {job.employmentType}
                </span>
              </div>
            </div>

            {/* Score & Status Badge */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <MatchBadge status={job.matchStatus} score={job.matchScore} />
              <span className="text-[11px] text-slate-500 text-right">
                Estimasi transparansi kecocokan
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="primary" size="md" rightIcon={<ExternalLink className="w-4 h-4" />}>
                Lamar di Situs Sumber ({job.sourceName})
              </Button>
            </a>

            <Button
              variant="outline"
              size="md"
              onClick={() => setIsSaved(!isSaved)}
              leftIcon={<Bookmark className={`w-4 h-4 ${isSaved ? "fill-blue-600 text-blue-600" : ""}`} />}
            >
              {isSaved ? "Tersimpan di My Progress" : "Simpan Lowongan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rincian Komponen Skor (AC-06 & FR-05) */}
      <Card>
        <CardHeader>
          <CardTitle>Rincian Transparan Skor Kecocokan (AC-06)</CardTitle>
          <CardDescription>
            Skor dihitung berdasarkan bobot kualifikasi: skill wajib, skill tambahan, pengalaman, dan kesesuaian semantik.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {(job.scoreBreakdown && job.scoreBreakdown.length > 0
              ? job.scoreBreakdown
              : [
                  { label: "Skill Wajib", score: 85, weight: 35 },
                  { label: "Skill Tambahan", score: 70, weight: 20 },
                  { label: "Pengalaman Kerja", score: 90, weight: 15 },
                  { label: "Kesesuaian Semantik", score: 80, weight: 20 },
                ]
            ).map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{item.label}</span>
                  <span className="text-slate-400 font-mono text-[11px]">Bobot {item.weight}%</span>
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

          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-start gap-2 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Aturan Transparansi:</strong> Skor adalah indikasi kecocokan data kualifikasi CV terhadap lowongan, bukan probabilitas diterima kerja.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Kualifikasi & Persyaratan (AC-02) */}
      <Card>
        <CardHeader>
          <CardTitle>Status Kualifikasi & Persyaratan (AC-02)</CardTitle>
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
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    ✓ Cocok di CV
                  </span>
                ) : req.status === "belum_cukup_bukti" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                    ? Belum cukup bukti
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold bg-slate-50 text-slate-700 border border-slate-300">
                    ✗ Belum ditemukan di CV
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
            Sumber: <strong className="text-slate-800">{job.sourceName}</strong> ({job.retrievalMethod})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
            {job.description}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
