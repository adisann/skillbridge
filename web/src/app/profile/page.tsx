"use client";

import { confirmAction } from "@/lib/dialogs";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Mail,
  ShieldCheck,
  CheckCircle2,
  FileText,
  RotateCcw,
  Sparkles,
  GraduationCap,
  BookOpen,
  Bookmark,
  ClipboardList,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AlertBanner } from "@/components/ui/error";
import { SkeletonCard } from "@/components/ui/loading";
import { useAuth } from "@/lib/supabase/auth-context";
import { fetchDeduped } from "@/lib/fetcher";
import { JOB_CATEGORIES } from "@/lib/job-categories";
import { cn } from "@/lib/utils";

interface ResumeSummary {
  filename?: string;
  education?: string;
  experienceYears?: number;
  summary?: string;
  skills?: string[];
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, isAdmin, logout, updateUserTargetRole, resetDemoState } = useAuth();
  const [resume, setResume] = useState<ResumeSummary | null>(null);
  const [learningCount, setLearningCount] = useState<number>(0);
  const [savedJobsCount, setSavedJobsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [specificPosition, setSpecificPosition] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      try {
        const [cvData, learnData, jobsData] = await Promise.all([
          fetchDeduped<{ resume?: ResumeSummary }>("/api/cv/save").catch(() => ({ resume: undefined })),
          fetchDeduped<{ learningItems?: unknown[] }>("/api/learning-items").catch(() => ({ learningItems: [] })),
          fetchDeduped<{ savedJobs?: unknown[] }>("/api/saved-jobs").catch(() => ({ savedJobs: [] })),
        ]);

        if (isMounted) {
          if (cvData.resume && cvData.resume.skills && cvData.resume.skills.length > 0) {
            setResume(cvData.resume);
          }
          if (learnData.learningItems) {
            setLearningCount(learnData.learningItems.length);
          }
          if (jobsData.savedJobs) {
            setSavedJobsCount(jobsData.savedJobs.length);
          }
        }
      } catch (err) {
        console.error("Gagal memuat ringkasan profil:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfileData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleFieldChange = async (fieldLabel: string) => {
    try { await updateUserTargetRole(fieldLabel); } catch (e) { setNotification((e as Error).message); return; }
    setNotification(`Target bidang kerja berhasil diperbarui menjadi ${fieldLabel}.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSpecificPositionSave = async () => {
    if (!specificPosition.trim()) return;
    try { await updateUserTargetRole(specificPosition.trim()); } catch (e) { setNotification((e as Error).message); return; }
    setNotification(`Target posisi berhasil disimpan: ${specificPosition.trim()}`);
    setSpecificPosition("");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleResetDemo = async () => {
    if (!await confirmAction("Kembalikan akun demo ke kondisi awal presentasi?", { destructive: false, confirmText: "Ya, reset" })) return;
    setIsResetting(true);
    try {
      await resetDemoState();
      setNotification("Akun demo berhasil direset ke kondisi awal.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      setNotification("Gagal mereset state demo.");
      setIsResetting(false);
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "SB";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isDemoAccount = !!user?.isDemo;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Banner (Replaces dark hero) */}
      <div className="page-banner rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sb-mist text-sb-navy font-extrabold text-xl flex items-center justify-center shadow-sm ring-1 ring-white/50 shrink-0">
              {getUserInitials(user?.fullName)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-sb-navy">
                  {user?.fullName || "Pengguna SkillBridge"}
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sb-mist-soft text-sb-blue border border-sb-border">
                  {isAdmin ? "Administrator" : "Pelamar"}
                </span>
                {isDemoAccount && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-sb-good border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-sb-good" />
                    Akun Demo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-sb-text-2">
                <Mail className="w-3.5 h-3.5 text-sb-blue" />
                <span className="font-mono-metric">{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              leftIcon={<LogOut className="w-3.5 h-3.5 text-sb-critical" />}
              className="text-xs"
            >
              Keluar Sesi
            </Button>
          </div>
        </div>
      </div>

      {notification && (
        <AlertBanner
          type="success"
          title="Pembaruan Berhasil"
          message={notification}
        />
      )}

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card: Target Bidang & Posisi Kerja */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sb-blue" />
                Target Bidang & Posisi Kerja
              </CardTitle>
              <CardDescription className="text-xs">
                Pilih bidang kerja utama dan ketik posisi spesifik untuk rekomendasi lowongan yang relevan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Field Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {JOB_CATEGORIES.slice(0, 8).map((cat) => {
                  const isSelected =
                    (user?.targetRole || "").toLowerCase().includes(cat.label.toLowerCase()) ||
                    (user?.targetRole || "").toLowerCase().includes(cat.slug);

                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => handleFieldChange(cat.label)}
                      className={cn(
                        "p-3.5 rounded-xl border text-left transition-ui cursor-pointer flex flex-col justify-between",
                        isSelected
                          ? "border-sb-sky bg-sb-mist-soft shadow-2xs font-bold"
                          : "border-sb-border hover:border-sb-blue/40 bg-white/70"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-sb-navy">{cat.label}</span>
                        {isSelected ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-sb-border" />
                        )}
                      </div>
                      <p className="text-[11px] text-sb-text-2 line-clamp-1">{cat.examples}</p>
                    </button>
                  );
                })}
              </div>

              {/* Specific Position Input */}
              <div className="pt-2 border-t border-sb-border">
                <label className="block text-xs font-bold text-sb-navy mb-1.5">
                  Posisi Spesifik (Opsional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={specificPosition}
                    onChange={(e) => setSpecificPosition(e.target.value)}
                    placeholder={`cth. ${user?.targetRole || "UX Researcher, Data Scientist, Frontend Developer"}`}
                    className="flex-1 h-10 px-3.5 rounded-xl border border-sb-border bg-white/80 text-xs font-semibold text-sb-navy focus:outline-none focus:ring-2 focus:ring-sb-blue"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSpecificPositionSave}
                    disabled={!specificPosition.trim()}
                    className="text-xs"
                  >
                    Simpan Posisi
                  </Button>
                </div>
                <p className="text-[11px] text-sb-text-2 mt-1.5">
                  Target saat ini: <strong className="text-sb-navy font-semibold">{user?.targetRole || "Data & Analitik"}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Status Berkas CV Aktif */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sb-blue" />
                  Status Berkas CV Aktif
                </CardTitle>
                <CardDescription className="text-xs">
                  Ringkasan kualifikasi CV yang digunakan untuk menghitung skor lowongan.
                </CardDescription>
              </div>
              <Link href="/cv">
                <Button variant="outline" size="sm" className="text-xs">
                  Koreksi CV
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {resume ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-white/70 border border-sb-border rounded-xl">
                      <span className="text-xs font-bold uppercase tracking-wider text-sb-text-2">Berkas Terunggah</span>
                      <p className="text-xs font-bold text-sb-navy truncate mt-0.5 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                        <span className="truncate">{resume.filename || "CV_Aktif.pdf"}</span>
                      </p>
                    </div>
                    <div className="p-3 bg-white/70 border border-sb-border rounded-xl">
                      <span className="text-xs font-bold uppercase tracking-wider text-sb-text-2">Pendidikan Terakhir</span>
                      <p className="text-xs font-bold text-sb-navy truncate mt-0.5 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-sb-blue" />
                        {resume.education || "S1 Komputer / Terkait"}
                      </p>
                    </div>
                    <div className="p-3 bg-white/70 border border-sb-border rounded-xl">
                      <span className="text-xs font-bold uppercase tracking-wider text-sb-text-2">Total Keahlian Ditemukan</span>
                      <p className="text-xs font-bold text-sb-good truncate mt-0.5 flex items-center gap-1.5 font-mono-metric">
                        <Sparkles className="w-3.5 h-3.5 text-sb-good" />
                        {resume.skills?.length || 0} skill terdaftar
                      </p>
                    </div>
                  </div>

                  {resume.summary && (
                    <div className="p-3 bg-sb-mist-soft border border-sb-border rounded-xl">
                      <span className="text-xs font-bold uppercase tracking-wider text-sb-blue">Ringkasan Profil CV</span>
                      <p className="text-xs text-sb-navy mt-1 leading-relaxed">
                        {resume.summary}
                      </p>
                    </div>
                  )}

                  {resume.skills && resume.skills.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-sb-navy block mb-2">
                        Keahlian Inti yang Teridentifikasi:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.skills.slice(0, 14).map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-sb-border text-sb-navy shadow-2xs"
                          >
                            {s}
                          </span>
                        ))}
                        {resume.skills.length > 14 && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-sb-mist-soft text-sb-blue border border-sb-border font-mono-metric">
                            +{resume.skills.length - 14} lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-sb-text-2 border border-dashed rounded-2xl border-sb-border space-y-2 bg-white/40">
                  <p>Belum ada berkas CV yang dianalisis.</p>
                  <Link href="/cv">
                    <Button variant="primary" size="sm" className="text-xs">
                      Unggah CV Sekarang
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Ringkasan Aktivitas & Tautan Cepat */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/progress" className="block group">
              <Card className="h-full group-hover:border-sb-blue/40 transition-ui">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-sb-text-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sb-blue" />
                      Rencana Belajar
                    </span>
                    <p className="text-xl font-bold text-sb-navy font-mono-metric">{learningCount} Target</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-sb-text-2 group-hover:text-sb-blue group-hover:translate-x-1 transition-ui" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/progress" className="block group">
              <Card className="h-full group-hover:border-sb-blue/40 transition-ui">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-sb-text-2 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-sb-blue" />
                      Lowongan Tersimpan
                    </span>
                    <p className="text-xl font-bold text-sb-navy font-mono-metric">{savedJobsCount} Lowongan</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-sb-text-2 group-hover:text-sb-blue group-hover:translate-x-1 transition-ui" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/tracker" className="block group">
              <Card className="h-full group-hover:border-sb-blue/40 transition-ui">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-sb-text-2 flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-sb-blue" />
                      Lamaran Saya
                    </span>
                    <p className="text-xs font-semibold text-sb-blue mt-1">Buka Pipeline</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-sb-text-2 group-hover:text-sb-blue group-hover:translate-x-1 transition-ui" />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Card: Opsi Khusus Akun Demo */}
          {isDemoAccount && (
            <div className="glass-panel p-5 rounded-2xl border border-sb-warning/40 space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-sb-navy flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-sb-warning" />
                  Mode Demo
                </h3>
                <p className="text-xs text-sb-text-2">
                  Kamu sedang memakai akun demo. Untuk mengembalikan target belajar dan riwayat interaksi ke keadaan awal, gunakan tombol di bawah ini.
                </p>
              </div>
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDemo}
                  disabled={isResetting}
                  className="text-xs border-sb-warning/40 text-sb-navy hover:bg-sb-warning/10"
                >
                  <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isResetting ? "animate-spin" : ""}`} />
                  {isResetting ? "Mereset akun demo..." : "Reset akun demo"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
