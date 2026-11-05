"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Trash2,
  ExternalLink,
  Plus,
  BookOpen,
  Bookmark,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TextInput } from "@/components/ui/input";
import { MatchBadge } from "@/components/ui/badge";
import { AlertBanner } from "@/components/ui/error";
import { SkeletonCard } from "@/components/ui/loading";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuth } from "@/lib/supabase/auth-context";

interface LearningItem {
  id: string;
  skillName: string;
  reason: string;
  resourceSuggestion: string;
  isDone: boolean;
  priority: string;
}

interface SavedJobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  sourceName: string;
  sourceUrl?: string;
  matchScore: number;
  matchStatus: "match" | "underqualified" | "potentially_overqualified" | "insufficient_evidence";
  matchedSkills: string[];
  missingSkills: string[];
}

export default function ProgressPage() {
  return (
    <ProtectedRoute>
      <ProgressContent />
    </ProtectedRoute>
  );
}

function ProgressContent() {
  const { user } = useAuth();
  const [learningList, setLearningList] = useState<LearningItem[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("Tinggi");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadProgress = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (user?.id) queryParams.append("userId", user.id);

        // 1. Ambil data lowongan tersimpan dari tabel saved_jobs
        const resJobs = await fetch(`/api/saved-jobs?${queryParams.toString()}`);
        if (resJobs.ok && isMounted) {
          const jData = await resJobs.json();
          setSavedJobs(jData.savedJobs || []);
        }

        // 2. Ambil data target belajar dari tabel learning_items
        const resLearning = await fetch(`/api/learning-items?${queryParams.toString()}`);
        if (resLearning.ok && isMounted) {
          const lData = await resLearning.json();
          setLearningList(lData.learningItems || []);
        }
      } catch (err) {
        console.error("Gagal memuat data progress:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProgress();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const toggleDone = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic UI update
    setLearningList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isDone: nextStatus } : item))
    );

    try {
      await fetch("/api/learning-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDone: nextStatus }),
      });
    } catch (err) {
      console.error("Gagal memperbarui status belajar:", err);
      // Rollback jika gagal
      setLearningList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isDone: currentStatus } : item))
      );
    }
  };

  const handleAddItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/learning-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          skillName: newTitle.trim(),
          reason: "Ditambahkan mandiri oleh pengguna berdasarkan analisis kebutuhan lowongan pasar.",
          priority: newPriority,
          resourceSuggestion: "Dokumentasi resmi dan latihan proyek studi kasus mandiri.",
        }),
      });

      const data = await res.json();
      if (res.ok && data.item) {
        setLearningList([data.item, ...learningList]);
        setNewTitle("");
        setNotification(`'${data.item.skillName}' berhasil ditambahkan ke daftar target belajar.`);
      }
    } catch {
      setNotification("Gagal menambahkan target belajar.");
    }
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await fetch(`/api/learning-items?id=${id}`, { method: "DELETE" });
      setLearningList((prev) => prev.filter((item) => item.id !== id));
      setNotification("Target belajar berhasil dihapus.");
    } catch {
      setNotification("Gagal menghapus target belajar.");
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUnsaveJob = async (jobId: string) => {
    try {
      await fetch("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, jobId }),
      });
      setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
      setNotification("Lowongan dihapus dari daftar simpanan.");
    } catch {
      setNotification("Gagal mengubah status simpanan lowongan.");
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const doneCount = learningList.filter((i) => i.isDone).length;
  const progressPercent = learningList.length > 0 ? Math.round((doneCount / learningList.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Progress (Target Belajar & Lowongan Tersimpan)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau progres penutupan skill gap dan kelola lowongan prioritas untuk persiapan melamar kerja (FR-09 & FR-10).
          </p>
        </div>
        <Link href="/insights">
          <Button variant="outline" size="sm">
            <Sparkles className="w-4 h-4 mr-1 text-emerald-600" />
            Cek Gap di Market Insights
          </Button>
        </Link>
      </div>

      {notification && (
        <AlertBanner
          type="success"
          title="Pembaruan Progress"
          message={notification}
        />
      )}

      {/* Progress Metric Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Progres Rencana Belajar
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">
              {doneCount} dari {learningList.length} Kompetensi Dikuasai
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Tingkatkan daya saing CV Anda dengan menyelesaikan target skill yang sering diminta pasar.
            </p>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
            {progressPercent}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-blue-950/80 rounded-full h-3 p-0.5 border border-blue-800">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div>
            <SkeletonCard />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri: Rencana Belajar (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    Target Peningkatan Skill
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Centang target yang telah Anda pelajari untuk memperbarui estimasi kesiapan kerja.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Form Tambah Target Baru */}
                <form onSubmit={handleAddItem} className="flex gap-2">
                  <div className="flex-1">
                    <TextInput
                      placeholder="Tambah target skill baru (cth. Snowflake, Airflow, PySpark)..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
                  >
                    <option value="Tinggi">Tinggi</option>
                    <option value="Menengah">Menengah</option>
                    <option value="Dasar">Dasar</option>
                  </select>
                  <Button type="submit" variant="primary" size="md">
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah
                  </Button>
                </form>

                {/* List Item Belajar */}
                {learningList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 border border-dashed rounded-xl border-slate-200">
                    Belum ada target belajar. Buka{" "}
                    <Link href="/insights" className="text-blue-600 font-semibold hover:underline">
                      Market Insights
                    </Link>{" "}
                    untuk menambahkan skill yang paling banyak dicari pasar kerja.
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {learningList.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          item.isDone
                            ? "bg-slate-50/70 border-slate-200 opacity-75"
                            : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleDone(item.id, item.isDone)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                            aria-label={item.isDone ? "Tandai belum selesai" : "Tandai selesai"}
                          >
                            {item.isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`font-bold text-sm ${
                                  item.isDone ? "line-through text-slate-400" : "text-slate-900"
                                }`}
                              >
                                {item.skillName}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                  item.priority === "Tinggi"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                Prioritas {item.priority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {item.reason}
                            </p>
                            {item.resourceSuggestion && (
                              <div className="text-[11px] text-blue-800 bg-blue-50/70 p-2 rounded-lg border border-blue-100 flex items-center gap-1.5 mt-1">
                                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Rekomendasi: {item.resourceSuggestion}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                          title="Hapus target belajar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan: Lowongan Tersimpan (1 Col) */}
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-blue-600" />
                    Lowongan Tersimpan ({savedJobs.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Lowongan yang Anda tandai di Job Explorer.
                  </CardDescription>
                </div>
                <Link href="/jobs" className="text-xs font-semibold text-blue-600 hover:underline">
                  Cari Lagi
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {savedJobs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 border border-dashed rounded-xl border-slate-200">
                    Belum ada lowongan yang disimpan. Buka{" "}
                    <Link href="/jobs" className="text-blue-600 font-semibold hover:underline">
                      Job Explorer
                    </Link>{" "}
                    dan klik ikon simpan pada kartu lowongan.
                  </div>
                ) : (
                  savedJobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{j.title}</h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {j.company} • {j.location}
                          </p>
                        </div>
                        <MatchBadge status={j.matchStatus} score={j.matchScore} />
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {j.matchedSkills.slice(0, 3).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                        {j.missingSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[11px] font-semibold text-slate-600">Belum ditemukan:</span>
                            {j.missingSkills.slice(0, 2).map((s) => (
                              <span key={s} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-700 font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => handleUnsaveJob(j.id)}
                          className="text-slate-400 hover:text-rose-600 text-[11px] hover:underline"
                        >
                          Hapus Simpanan
                        </button>
                        <Link
                          href={`/jobs/${j.id}`}
                          className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 text-[11px]"
                        >
                          Detail Gap <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
