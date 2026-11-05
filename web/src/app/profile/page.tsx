"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Briefcase,
  GraduationCap,
  FileText,
  BookOpen,
  Bookmark,
  ClipboardList,
  ShieldCheck,
  RotateCcw,
  LogOut,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AlertBanner } from "@/components/ui/error";
import { SkeletonCard } from "@/components/ui/loading";
import { useAuth } from "@/lib/supabase/auth-context";
import { fetchDeduped } from "@/lib/fetcher";

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

  const handleRoleChange = (role: "Data Analyst" | "BI Analyst") => {
    if (user?.targetRole === role) return;
    updateUserTargetRole(role);
    setNotification(`Target peran berhasil diperbarui menjadi ${role}.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleResetDemo = async () => {
    if (!window.confirm("Kembalikan akun demo ke kondisi awal presentasi?")) return;
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

  const isDemoAccount =
    user?.email?.includes("demo") || user?.email === "juri@skillbridge.demo";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Profil Saya
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola data akun, preferensi peran kerja impian, dan status berkas CV aktifmu.
        </p>
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
          {/* Card 1: Identitas Akun */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-xl flex items-center justify-center shadow-md shrink-0">
                    {getUserInitials(user?.fullName)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                        {user?.fullName || "Pengguna SkillBridge"}
                      </h2>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {isAdmin ? "Administrator" : "Pelamar"}
                      </span>
                      {isDemoAccount && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Akun Demo Juri
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="font-mono">{user?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-500" />}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    Keluar Sesi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Preferensi Target Role (FR-01) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Target Peran Kerja Utama
              </CardTitle>
              <CardDescription className="text-xs">
                Pencocokan kualifikasi lowongan dan analisis tren skill pasar akan diselaraskan dengan target peran ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Opsi Data Analyst */}
                <button
                  type="button"
                  onClick={() => handleRoleChange("Data Analyst")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    user?.targetRole === "Data Analyst"
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-slate-900">Data Analyst</span>
                    {user?.targetRole === "Data Analyst" ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Fokus pada ekstraksi data, SQL queries, analisis statistik, visualisasi data, dan pemecahan masalah bisnis berbasis data.
                  </p>
                </button>

                {/* Opsi BI Analyst */}
                <button
                  type="button"
                  onClick={() => handleRoleChange("BI Analyst")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    user?.targetRole === "BI Analyst"
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-slate-900">BI Analyst</span>
                    {user?.targetRole === "BI Analyst" ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Fokus pada data modeling, arsitektur dashboard, KPI monitoring, Power BI / Tableau, dan pelaporan strategis manajemen.
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Status Berkas CV Aktif */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Status Berkas CV Aktif
                </CardTitle>
                <CardDescription className="text-xs">
                  Ringkasan kualifikasi CV yang digunakan untuk menghitung skor kecocokan lowongan.
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
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Berkas Terunggah</span>
                      <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                        {resume.filename || "CV_Terverifikasi.pdf"}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pendidikan Terakhir</span>
                      <p className="text-xs font-bold text-slate-800 truncate mt-0.5 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        {resume.education || "S1 Komputer / Terkait"}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Keahlian Ditemukan</span>
                      <p className="text-xs font-bold text-emerald-700 truncate mt-0.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        {resume.skills?.length || 0} skill terdaftar
                      </p>
                    </div>
                  </div>

                  {resume.summary && (
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Ringkasan Profil CV</span>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        {resume.summary}
                      </p>
                    </div>
                  )}

                  {resume.skills && resume.skills.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block mb-2">
                        Keahlian Inti yang Teridentifikasi:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.skills.slice(0, 14).map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {s}
                          </span>
                        ))}
                        {resume.skills.length > 14 && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            +{resume.skills.length - 14} lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 border border-dashed rounded-xl border-slate-200 space-y-2">
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

          {/* Card 4: Ringkasan Aktivitas & Tautan Cepat */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/progress" className="block group">
              <Card className="h-full group-hover:border-blue-300 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      Rencana Belajar
                    </span>
                    <p className="text-xl font-bold text-slate-900">{learningCount} Target</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/progress" className="block group">
              <Card className="h-full group-hover:border-blue-300 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                      Lowongan Tersimpan
                    </span>
                    <p className="text-xl font-bold text-slate-900">{savedJobsCount} Lowongan</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/tracker" className="block group">
              <Card className="h-full group-hover:border-blue-300 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                      Pelacakan Lamaran
                    </span>
                    <p className="text-xs font-semibold text-blue-600 mt-1">Buka Pipeline</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Card 5: Opsi Khusus Akun Demo */}
          {isDemoAccount && (
            <Card className="border-amber-200 bg-amber-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-900 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-700" />
                  Mode Demo Juri Presentasi
                </CardTitle>
                <CardDescription className="text-xs text-amber-700">
                  Kamu sedang menggunakan akun demo juri. Jika perlu mengatur ulang target belajar atau riwayat interaksi kembali ke keadaan bersih awal, gunakan tombol di bawah ini.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDemo}
                  disabled={isResetting}
                  className="text-xs border-amber-300 text-amber-900 hover:bg-amber-100/70"
                >
                  <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isResetting ? "animate-spin" : ""}`} />
                  {isResetting ? "Mereset data demo..." : "Reset Data Demo ke Awal"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
