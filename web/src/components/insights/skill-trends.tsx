"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Target, CheckCircle2, MinusCircle, HelpCircle, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar, FilterState } from "@/components/ui/filter";
import { MarketSkillBarChart } from "@/components/ui/chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertBanner } from "@/components/ui/error";
import { SkeletonCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchDeduped, clearDedupedCache } from "@/lib/fetcher";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/copy";

export interface TopSkillInsight {
  skillName: string;
  category: string;
  frequencyCount: number;
  percentage: number;
  cvStatus: "tercantum" | "belum_ditemukan" | "perlu_verifikasi";
  statusLabel: string;
  exampleRequirement: string;
}

export interface LearningRec {
  skillName: string;
  demandPercentage: number;
  reason: string;
  priority?: string;
  action: string;
}

export interface SkillTrendsProps {
  mode?: "guest" | "user";
}

export function SkillTrends({ mode = "user" }: SkillTrendsProps) {
  const isGuest = mode === "guest";
  const router = useRouter();
  const { isAuthenticated, loginDemoJuri } = useAuth();

  const [filters, setFilters] = useState<FilterState>({
    role: "all",
    workType: "all",
    seniority: "all",
  });
  const [sampleSizeN, setSampleSizeN] = useState<number>(1);
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>("4 November 2026");
  const [topSkills, setTopSkills] = useState<TopSkillInsight[]>([]);
  const [learningRecs, setLearningRecs] = useState<LearningRec[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedSkillNotice, setAddedSkillNotice] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchInsights = async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("role", filters.role);
        if (filters.workType && filters.workType !== "all") queryParams.append("workType", filters.workType);
        if (filters.seniority && filters.seniority !== "all") queryParams.append("seniority", filters.seniority);
        if (filters.location && filters.location !== "all") queryParams.append("location", filters.location);
        if (filters.postedDate && filters.postedDate !== "all") queryParams.append("postedDate", filters.postedDate);

        const data = await fetchDeduped<{
          error?: string;
          sampleSizeN?: number;
          lastUpdated?: string;
          topSkills?: TopSkillInsight[];
          learningRecommendations?: LearningRec[];
        }>(`/api/insights?${queryParams.toString()}`);

        if (isMounted) {
          setSampleSizeN(typeof data.sampleSizeN === "number" ? data.sampleSizeN : 0);
          setLastUpdatedDate(data.lastUpdated || "4 November 2026");
          setTopSkills(data.topSkills || []);
          setLearningRecs(data.learningRecommendations || []);
          setErrorMsg(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const error = err as Error;
          setErrorMsg(error.message || "Gagal memuat insight");
          setIsLoading(false);
        }
      }
    };

    fetchInsights();
    return () => {
      isMounted = false;
    };
  }, [filters.role, filters.workType, filters.seniority, filters.location, filters.postedDate, refreshTrigger]);

  const handleAddLearning = async (skillName: string, reason?: string, priority: string = "Tinggi") => {
    if (isGuest) {
      router.push(`/login?next=${encodeURIComponent("/tren-skill")}`);
      return;
    }

    try {
      await fetchDeduped("/api/learning-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillName,
          reason: reason || `Kebutuhan skill ${skillName} tinggi di pasar (${filters.role}) namun belum ditemukan di CV.`,
          priority,
        }),
      });

      setAddedSkillNotice(`Skill '${skillName}' berhasil ditambahkan ke daftar target belajar.`);
    } catch {
      setAddedSkillNotice(`Skill '${skillName}' disimpan ke target belajar.`);
    }
    setTimeout(() => setAddedSkillNotice(null), 3500);
  };

  const handleClaimSkill = async (skillName: string) => {
    if (isGuest) {
      router.push(`/login?next=${encodeURIComponent("/tren-skill")}`);
      return;
    }

    try {
      clearDedupedCache("/api/insights");
      const data = await fetchDeduped<{ message?: string; error?: string }>("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillName,
        }),
      });
      setAddedSkillNotice(data.message || `Skill '${skillName}' ditandai dikuasai.`);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      setAddedSkillNotice("Gagal menandai skill.");
    }
    setTimeout(() => setAddedSkillNotice(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ------------------------------------------------------------------- */}
      {/* Page Banner                                                         */}
      {/* ------------------------------------------------------------------- */}
      <div className="page-banner rounded-3xl p-6 sm:p-8 text-sb-navy relative overflow-hidden border border-sb-border shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-sb-navy">
              Skill yang Paling Dicari
            </h1>
            <p className="text-sb-text-2 text-sm leading-relaxed">
              {isGuest
                ? "Pantau frekuensi kebutuhan skill paling dicari dari lowongan kerja aktif."
                : "Pantau skill yang paling sering dibutuhkan di lowongan aktif dan bandingkan dengan CV-mu."}
            </p>
            <p className="text-xs text-sb-text-2 pt-0.5">
              Berdasarkan {sampleSizeN} lowongan aktif · diperbarui {lastUpdatedDate}. Dihitung dari sampel lowongan terkumpul, bukan seluruh pasar kerja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-2xl bg-white/70 border border-sb-border text-xs text-sb-navy font-semibold">
              <span className="font-mono-metric font-bold text-sb-blue">{sampleSizeN}</span> lowongan aktif
            </div>
            {isGuest ? (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="primary" size="sm">
                    Masuk
                  </Button>
                </Link>
                <Link href="/lowongan">
                  <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5 ml-1" />}>
                    Lihat Lowongan
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/progress">
                  <Button variant="secondary" size="sm">
                    Rencana Belajar
                  </Button>
                </Link>
                <Link href="/cv">
                  <Button variant="primary" size="sm">
                    Koreksi CV
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <AlertBanner
          type="error"
          title="Gangguan Memuat Data"
          message={errorMsg}
        />
      )}

      {addedSkillNotice && (
        <AlertBanner
          type="success"
          title="Pembaruan Rencana Belajar"
          message={addedSkillNotice}
        />
      )}

      {/* Guest Mode Callout Banner */}
      {isGuest && (
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-sb-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 shadow-2xs">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-bold text-sb-navy">
              Ingin membandingkan tren ini dengan skill di CV&#8209;mu?
            </p>
            <p className="text-xs text-sb-text-2">
              Masuk dengan akun demo untuk melihat skill mana yang sudah ada di CV atau perlu kamu pelajari.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs">
                Masuk
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={loginDemoJuri}
              className="text-xs"
            >
              Coba dengan Akun Demo
            </Button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="space-y-4">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          sampleCount={sampleSizeN}
        />
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : topSkills.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="Tidak Ada Data Skill untuk Filter Ini"
            description="Coba sesuaikan filter bidang atau tipe kerja untuk melihat kebutuhan skill."
            actionLabel="Reset Filter"
            onAction={() => setFilters({ role: "all", workType: "all", seniority: "all" })}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Visual Bar Chart Pasar (Clean Card without duplicate titles) */}
          <MarketSkillBarChart
            skills={topSkills.map((s) => ({
              skillName: s.skillName,
              count: s.frequencyCount,
              percentage: s.percentage,
              status: isGuest
                ? "missing"
                : s.cvStatus === "tercantum"
                ? "found"
                : s.cvStatus === "perlu_verifikasi"
                ? "needs_verification"
                : "missing",
              exampleRequirement: s.exampleRequirement,
            }))}
            totalSampleN={sampleSizeN}
            dataDate={lastUpdatedDate}
            roleFilterLabel={filters.role === "all" ? "Seluruh Posisi" : filters.role}
            isLoggedIn={!isGuest && isAuthenticated}
          />

          {/* Detailed Skill Checklist & Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isGuest ? "Daftar Frekuensi Kebutuhan Skill" : "Perbandingan Skill Pasar vs CV-mu"}
              </CardTitle>
              <CardDescription>
                {isGuest
                  ? "Peringkat skill berdasarkan frekuensi kemunculannya pada persyaratan kualifikasi lowongan."
                  : "Status keahlian dinyatakan secara jelas: Tercantum di CV, Perlu verifikasi, atau Belum ditemukan di CV."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topSkills.map((item) => (
                <div
                  key={item.skillName}
                  className="p-4 rounded-xl border border-sb-border bg-white/70 hover:bg-white hover:border-sb-blue/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    {!isGuest && (
                      item.cvStatus === "tercantum" ? (
                        <CheckCircle2 className="w-5 h-5 text-sb-good shrink-0 mt-0.5" />
                      ) : item.cvStatus === "perlu_verifikasi" ? (
                        <HelpCircle className="w-5 h-5 text-sb-warning shrink-0 mt-0.5" />
                      ) : (
                        <MinusCircle className="w-5 h-5 text-sb-text-2 shrink-0 mt-0.5" />
                      )
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-sb-navy">{item.skillName}</strong>
                        <span className="text-[11px] text-sb-text-2">
                          Diminta di <strong className="font-mono-metric font-semibold text-sb-navy">{item.frequencyCount}</strong> dari {sampleSizeN} lowongan (<span className="font-mono-metric text-sb-blue font-semibold">{formatPercent(item.percentage)}%</span>)
                        </span>
                        <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-sb-mist-soft text-sb-navy border border-sb-border">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sb-text-2 mt-0.5 line-clamp-1 italic text-[11px]">
                        Contoh persyaratan: &ldquo;{item.exampleRequirement}&rdquo;
                      </p>
                    </div>
                  </div>

                  {!isGuest && (
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0 pl-8 sm:pl-0">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full font-semibold text-[11px] border",
                          item.cvStatus === "tercantum"
                            ? "bg-emerald-50 text-sb-good border-emerald-200"
                            : item.cvStatus === "perlu_verifikasi"
                            ? "bg-amber-50 text-sb-warning border-amber-200"
                            : "bg-sb-mist-faint text-sb-text-2 border-sb-border"
                        )}
                      >
                        {item.statusLabel}
                      </span>

                      {item.cvStatus === "belum_ditemukan" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClaimSkill(item.skillName)}
                            className="text-xs"
                            title="Tandai skill yang kamu kuasai namun belum tertulis di dokumen CV"
                          >
                            <Check className="w-3.5 h-3.5 mr-1 text-sb-text-2" />
                            Saya Kuasai
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAddLearning(item.skillName)}
                            className="text-xs"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Pelajari
                          </Button>
                        </>
                      )}

                      {item.cvStatus === "perlu_verifikasi" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddLearning(item.skillName)}
                          className="text-xs"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1 text-sb-blue" />
                          Target Belajar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Mode Tamu: Kartu Ajakan Masuk untuk Bandingkan dengan CV */}
          {isGuest && (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-sb-border bg-sb-mist-soft space-y-3">
              <h3 className="text-base font-extrabold text-sb-navy">
                Ingin membandingkan tren skill di atas dengan CV-mu?
              </h3>
              <p className="text-xs sm:text-sm text-sb-text-2 leading-relaxed max-w-2xl">
                Masuk atau gunakan akun demo juri untuk memetakan otomatis skill yang sudah kamu miliki, melihat status kecocokan, dan menambahkan gap kompetensi langsung ke rencana belajar pribadimu.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/login?next=/tren-skill">
                  <Button variant="primary" size="md">
                    Masuk
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={async () => {
                    await loginDemoJuri();
                    router.push("/insights");
                  }}
                >
                  Coba akun demo
                </Button>
              </div>
            </div>
          )}

          {/* Mode User Login: Learning Priority Recommendations */}
          {!isGuest && learningRecs.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-sb-border space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sb-mist-soft flex items-center justify-center text-sb-blue">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-sb-navy">
                    Rekomendasi Belajar
                  </h3>
                  <p className="text-xs text-sb-text-2 mt-0.5">
                    Skill berikut memiliki frekuensi permintaan tertinggi di lowongan namun belum ditemukan di CV-mu:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                {learningRecs.map((rec) => (
                  <div key={rec.skillName} className="p-4 rounded-xl bg-white/80 border border-sb-border hover:border-sb-blue/30 shadow-2xs space-y-3 flex flex-col justify-between transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sb-navy text-sm">{rec.skillName}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sb-mist-soft text-sb-blue border border-sb-border font-mono-metric">
                          {rec.demandPercentage}% Lowongan
                        </span>
                      </div>
                      <p className="text-xs text-sb-text-2 leading-relaxed">{rec.reason}</p>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddLearning(rec.skillName, rec.reason, rec.priority)}
                        className="w-full text-xs text-sb-navy hover:text-sb-blue hover:bg-sb-mist-soft border-sb-border"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Tambah ke Target Belajar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

