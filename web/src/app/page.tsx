"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  const [totalJobs, setTotalJobs] = useState<number>(42);
  const [topSkills, setTopSkills] = useState<Array<{ skillName: string; percentage: number; count: number }>>([
    { skillName: "Microsoft Excel", percentage: 38, count: 16 },
    { skillName: "SQL", percentage: 36, count: 15 },
    { skillName: "Power BI", percentage: 31, count: 13 },
  ]);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [jobsRes, insightsRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/insights?role=Data Analyst"),
        ]);
        const jData = await jobsRes.json();
        const iData = await insightsRes.json();

        if (jData.total) setTotalJobs(jData.total);
        if (iData.topSkills && iData.topSkills.length > 0) {
          setTopSkills(
            iData.topSkills.slice(0, 3).map((s: { skillName: string; percentage: number; frequencyCount: number }) => ({
              skillName: s.skillName,
              percentage: s.percentage,
              count: s.frequencyCount,
            }))
          );
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchLandingData();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50/40 pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            INVOFEST 2026 — Subtema: Digital Economy & Sociopreneurship (SDG 8 & 10)
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Jembatani CV Anda ke <span className="text-blue-600">Peluang Nyata</span> Pasar Kerja
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Ketahui lowongan yang relevan dengan CV Anda, temukan keahlian yang belum terdeteksi, dan pahami tren keterampilan paling dicari untuk peran <strong>Data Analyst</strong> & <strong>BI Analyst</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/cv" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full sm:w-auto text-sm sm:text-base shadow-sm">
                Analisis CV Saya Sekarang <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/jobs" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base">
                Jelajahi {totalJobs} Lowongan Aktif
              </Button>
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {totalJobs} Lowongan Nyata Terkoneksi
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Penyimpanan CV Privat (Cloudflare R2)
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Akun 1-Klik Khusus Juri Demo
            </span>
          </div>
        </div>
      </section>

      {/* 3 Steps Cara Kerja */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cara Kerja SkillBridge
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Hanya butuh tiga langkah terstruktur untuk mendapatkan peta kesesuaian karier dan rencana peningkatan kompetensi Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900">Unggah & Tinjau CV (AC-01)</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Unggah dokumen CV PDF atau DOCX Anda. Sistem mengekstrak skill dan memberi kebebasan mengoreksi hasil ekstraksi sebelum analisis dimulai.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900">Eksplorasi Kesesuaian (Job Explorer)</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tinjau estimasi skor kecocokan, pisahkan kualifikasi yang cocok vs belum ditemukan, dan pahami alasan di balik setiap penilaian.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900">Analisis Kebutuhan Pasar (Insights)</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Lihat top skill paling sering diminta untuk role Data Analyst / BI Analyst, tandai gap di CV Anda, dan simpan rencana belajar terarah.
            </p>
          </Card>
        </div>
      </section>

      {/* Live Market Insights Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900 text-white shadow-xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <TrendingUp className="w-4 h-4" />
                Tren Permintaan Keterampilan Terkini
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Preview Market Insights (Role: Data Analyst)
              </h3>
            </div>
            <Link href="/insights">
              <Button variant="outline" size="sm" className="bg-transparent text-white border-slate-700 hover:bg-slate-800 text-xs">
                Lihat Analisis Lengkap <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topSkills.map((s, idx) => (
              <div key={s.skillName} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">Peringkat #{idx + 1}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
                    {s.percentage}% Lowongan
                  </span>
                </div>
                <div className="text-lg font-extrabold text-white">{s.skillName}</div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Disebut pada {s.count} lowongan dari total sampel aktif di basis data.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Juri CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Siap untuk Evaluasi Presentasi INVOFEST 2026?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Gunakan fitur login 1-klik khusus juri untuk langsung mengevaluasi sistem dengan data CV dan katalog lowongan yang sudah terpasang.
        </p>
        <div className="pt-2">
          <Link href="/login">
            <Button size="md" variant="primary">
              Masuk via Akun Demo Juri (1-Klik)
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
