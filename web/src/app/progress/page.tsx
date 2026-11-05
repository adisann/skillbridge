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
  Check,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TextInput } from "@/components/ui/input";
import { MatchBadge } from "@/components/ui/badge";
import { AlertBanner } from "@/components/ui/error";
import { SkeletonCard } from "@/components/ui/loading";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuth } from "@/lib/supabase/auth-context";
import { fetchDeduped } from "@/lib/fetcher";

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
        const [jData, lData] = await Promise.all([
          fetchDeduped<{ savedJobs?: SavedJobItem[] }>("/api/saved-jobs").catch(() => ({ savedJobs: [] as SavedJobItem[] })),
          fetchDeduped<{ learningItems?: LearningItem[] }>("/api/learning-items").catch(() => ({ learningItems: [] as LearningItem[] })),
        ]);

        if (isMounted) {
          if (jData.savedJobs) setSavedJobs(jData.savedJobs);
          if (lData.learningItems) setLearningList(lData.learningItems);
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
      await fetchDeduped("/api/learning-items", {
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
      const data = await fetchDeduped<{ item?: LearningItem }>("/api/learning-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillName: newTitle.trim(),
          reason: "Ditambahkan mandiri oleh pengguna berdasarkan analisis kebutuhan lowongan.",
          priority: newPriority,
          resourceSuggestion: "Dokumentasi resmi dan latihan studi kasus mandiri.",
        }),
      });

      if (data.item) {
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
      await fetchDeduped(`/api/learning-items?id=${id}`, { method: "DELETE" });
      setLearningList((prev) => prev.filter((item) => item.id !== id));
      setNotification("Target belajar berhasil dihapus.");
    } catch {
      setNotification("Gagal menghapus target belajar.");
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUnsaveJob = async (jobId: string) => {
    try {
      await fetchDeduped("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
      setNotification("Lowongan dihapus dari daftar simpanan.");
    } catch {
      setNotification("Gagal mengubah status simpanan lowongan.");
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const doneCount = learningList.filter((i) => i.isDone).length;
  const progressPercent = learningList.length > 0 ? Math.min(100, Math.max(0, Math.round((doneCount / learningList.length) * 100))) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ------------------------------------------------------------------- */}
      {/* Page Banner (Sky-Blue Light Gradient, No Eyebrows)                 */}
      {/* ------------------------------------------------------------------- */}
      <div className="page-banner rounded-3xl p-6 sm:p-8 text-sb-navy relative overflow-hidden border border-sb-border shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-sb-border">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-sb-navy">
              Rencana Belajar
            </h1>
            <p className="text-sb-text-2 text-sm leading-relaxed">
              Centang skill yang sudah kamu pelajari.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/insights">
              <Button variant="secondary" size="sm">
                <BarChart2 className="w-4 h-4 mr-1 text-sb-blue" />
                Lihat Tren Skill
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Progress Metrics */}
        <div className="relative z-10 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-sb-navy">
              {doneCount} dari {learningList.length} Skill Selesai Dipelajari
            </h2>
            <p className="text-xs text-sb-text-2">
              Pelajari skill yang sering dibutuhkan di lowongan incaranmu.
            </p>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-sb-blue font-mono-metric shrink-0">
            {progressPercent}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative z-10 w-full bg-sb-mist-soft rounded-full h-3 p-0.5 border border-sb-border mt-4 overflow-hidden">
          <div
            className="bg-sb-sky h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {notification && (
        <AlertBanner
          type="success"
          title="Pembaruan Rencana Belajar"
          message={notification}
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          <div className="xl:col-span-2 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div>
            <SkeletonCard />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Kolom Kiri: Target Belajar (2 Cols pada xl, 1 Col pada lg) */}
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sb-blue" />
                    Target Belajar
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Centang skill yang sudah kamu pelajari untuk memantau kemajuanmu.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Form Tambah Target Baru */}
                <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2">
                  <div className="flex-1 min-w-0">
                    <TextInput
                      placeholder="Tambah target skill baru (cth. SQL, React, Excel)..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="text-xs font-semibold px-3 py-2 rounded-xl border border-sb-border bg-white text-sb-navy focus:outline-none focus:ring-1 focus:ring-sb-blue"
                    >
                      <option value="Tinggi">Tinggi</option>
                      <option value="Menengah">Menengah</option>
                      <option value="Dasar">Dasar</option>
                    </select>
                    <Button type="submit" variant="primary" size="md" className="whitespace-nowrap shrink-0">
                      <Plus className="w-4 h-4 mr-1 shrink-0" />
                      Tambah
                    </Button>
                  </div>
                </form>

                {/* List Item Belajar */}
                {learningList.length === 0 ? (
                  <div className="py-10 text-center text-xs text-sb-text-2 border border-dashed rounded-2xl border-sb-border bg-white/40">
                    Belum ada target belajar. Buka{" "}
                    <Link href="/insights" className="text-sb-blue font-semibold hover:underline">
                      Tren Skill
                    </Link>{" "}
                    untuk menambahkan skill yang sering dicari.
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {learningList.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all duration-150 flex items-start justify-between gap-3 ${
                          item.isDone
                            ? "bg-white/40 border-sb-border opacity-70"
                            : "bg-white/80 border-sb-border hover:border-sb-blue/40 hover:shadow-2xs"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleDone(item.id, item.isDone)}
                            className="mt-0.5 text-sb-text-2 hover:text-sb-good transition-colors shrink-0"
                            aria-label={item.isDone ? "Tandai belum selesai" : "Tandai selesai"}
                          >
                            {item.isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-sb-good" />
                            ) : (
                              <Circle className="w-5 h-5 text-sb-text-2" />
                            )}
                          </button>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`font-bold text-sm ${
                                  item.isDone ? "line-through text-sb-text-2" : "text-sb-navy"
                                }`}
                              >
                                {item.skillName}
                              </span>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                  item.priority === "Tinggi"
                                    ? "bg-sb-critical/10 text-sb-critical border-sb-critical/30"
                                    : "bg-sb-mist-soft text-sb-navy border border-sb-border"
                                }`}
                              >
                                Prioritas {item.priority}
                              </span>
                            </div>
                            <p className="text-xs text-sb-text-2 leading-relaxed">
                              {item.reason}
                            </p>
                            {item.resourceSuggestion && (
                              <div className="text-[11px] text-sb-text-2 bg-sb-mist-soft p-2.5 rounded-xl border border-sb-border flex items-center gap-1.5 mt-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                                <span>Rekomendasi: {item.resourceSuggestion}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-sb-text-2 hover:text-sb-critical p-1.5 rounded-lg hover:bg-sb-critical/10 transition-colors shrink-0"
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
              <CardHeader className="pb-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2 min-w-0">
                    <Bookmark className="w-4 h-4 text-sb-blue shrink-0" />
                    <span className="truncate">Lowongan Tersimpan ({savedJobs.length})</span>
                  </CardTitle>
                  <Link
                    href="/jobs"
                    className="text-xs font-semibold text-sb-blue hover:underline whitespace-nowrap shrink-0"
                  >
                    Cari Lagi
                  </Link>
                </div>
                <CardDescription className="text-xs">
                  Lowongan yang kamu simpan dari Cari Lowongan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Tracker CTA Callout */}
                <div className="p-3.5 glass-panel border border-sb-border rounded-xl space-y-2.5">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-sb-navy">Pelacakan Lamaran Kerja</p>
                    <p className="text-[11px] text-sb-text-2 leading-relaxed">
                      Atur prioritas dan pantau tahapan seleksimu.
                    </p>
                  </div>
                  <Link href="/tracker" className="block">
                    <Button
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5 shrink-0" />}
                      className="w-full text-xs justify-center whitespace-nowrap"
                    >
                      Buka Pelacakan
                    </Button>
                  </Link>
                </div>

                {savedJobs.length === 0 ? (
                  <div className="py-10 text-center text-xs text-sb-text-2 border border-dashed rounded-2xl border-sb-border bg-white/40">
                    Belum ada lowongan yang disimpan. Buka{" "}
                    <Link href="/jobs" className="text-sb-blue font-semibold hover:underline">
                      Lowongan
                    </Link>{" "}
                    dan klik ikon simpan pada kartu lowongan.
                  </div>
                ) : (
                  savedJobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-4 rounded-xl border border-sb-border bg-white/70 hover:bg-white hover:border-sb-blue/40 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-sb-navy line-clamp-1">{j.title}</h4>
                          <p className="text-[11px] text-sb-text-2 font-medium">
                            {j.company} • {j.location}
                          </p>
                        </div>
                        <MatchBadge status={j.matchStatus} score={j.matchScore} />
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {j.matchedSkills.slice(0, 3).map((s) => (
                            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sb-good/10 text-sb-good border border-sb-good/30 text-xs font-semibold">
                              <Check className="w-2.5 h-2.5 text-sb-good" />
                              {s}
                            </span>
                          ))}
                        </div>
                        {j.missingSkills.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[11px] font-semibold text-sb-text-2">Belum ditemukan:</span>
                            {j.missingSkills.slice(0, 2).map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded-full bg-sb-mist-soft border border-sb-border text-xs text-sb-text-2 font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-sb-border flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => handleUnsaveJob(j.id)}
                          className="text-sb-text-2 hover:text-sb-critical text-[11px] hover:underline"
                        >
                          Hapus
                        </button>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/tracker`}
                            className="text-sb-blue font-semibold hover:underline text-[11px]"
                          >
                            Atur Pipeline
                          </Link>
                          <span className="text-sb-border">•</span>
                          <Link
                            href={`/jobs/${j.id}`}
                            className="text-sb-blue font-semibold hover:underline inline-flex items-center gap-1 text-[11px]"
                          >
                            Rincian <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
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
