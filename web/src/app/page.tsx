"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BookmarkCheck,
  Layers,
  ChevronRight,
  BarChart3,
  SlidersHorizontal,
  Check,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/supabase/auth-context";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [marketSkills, setMarketSkills] = useState<Array<{ name: string; percentage: number; count: number }>>([
    { name: "SQL", percentage: 78, count: 33 },
    { name: "Microsoft Excel", percentage: 71, count: 30 },
    { name: "Power BI", percentage: 55, count: 23 },
    { name: "Python", percentage: 48, count: 20 },
    { name: "Tableau", percentage: 38, count: 16 },
  ]);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const insightsRes = await fetch("/api/insights?role=all");
        const iData = await insightsRes.json();

        if (iData.topSkills && iData.topSkills.length > 0) {
          setMarketSkills(
            iData.topSkills.slice(0, 5).map((s: { skillName: string; percentage: number; frequencyCount: number }) => ({
              name: s.skillName,
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
    <div className="w-full space-y-24 pb-24 overflow-hidden">
      {/* 1. Hero Section */}
      <section className="relative pt-16 sm:pt-24 lg:pt-32 pb-16">
        {/* Subtle grid background */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-slate-100 text-xs font-medium shadow-xs">
            <span>Pencocokan CV dengan lowongan nyata</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-slate-950 tracking-tight leading-[1.12] max-w-4xl mx-auto text-balance">
            Lihat seberapa siap CV-mu untuk lowongan yang benar-benar dibuka
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Unggah CV, dan kami bandingkan dengan lowongan aktif di berbagai bidang. Kamu langsung tahu skill mana yang kurang.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            {isAuthenticated && user ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-150"
                  rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                  Buka Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-[background-color,box-shadow] duration-150"
                  rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                  Coba dengan akun demo
                </Button>
              </Link>
            )}

            <Link href="/jobs" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-medium border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors duration-150"
              >
                Cari Lowongan
              </Button>
            </Link>

            <Link href="#cara-kerja" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="ghost"
                className="w-full sm:w-auto px-5 py-3 rounded-full text-sm font-medium text-slate-600 hover:text-slate-950"
              >
                Pelajari Cara Kerja
              </Button>
            </Link>
          </div>

          {/* Value Highlights */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-slate-700" />
              Lowongan Terverifikasi
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              Privasi Dokumen Terjamin
            </span>
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-slate-700" />
              Penilaian 5 Komponen Transparan
            </span>
          </div>
        </div>
      </section>

      {/* 2. Section Fitur */}
      <section id="fitur" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Inteligensi Berbasis Bukti
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-950 tracking-tight">
            Setiap skor bisa kamu telusuri asalnya
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Setiap kesimpulan kecocokan, kesenjangan keahlian, dan perbandingan pasar didasarkan pada teks kebutuhan riil dari rekruter.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: 5-Component Transparent Matching */}
          <div className="md:col-span-2 group p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-400 transition-[border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Penilaian Kualifikasi Berbasis 5 Komponen
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                Bukan kotak hitam. Skor kecocokan dihitung transparan dari keahlian wajib (35%), keahlian tambahan (20%), pengalaman kerja (15%), pendidikan (10%), dan kesesuaian semantik (20%).
              </p>

              {/* Visual Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <div className="text-lg font-bold text-slate-900">35%</div>
                  <div className="text-[10px] text-slate-500 font-medium">Keahlian Wajib</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <div className="text-lg font-bold text-slate-900">20%</div>
                  <div className="text-[10px] text-slate-500 font-medium">Keahlian Tambahan</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <div className="text-lg font-bold text-slate-900">15%</div>
                  <div className="text-[10px] text-slate-500 font-medium">Pengalaman</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <div className="text-lg font-bold text-slate-900">10%</div>
                  <div className="text-[10px] text-slate-500 font-medium">Pendidikan</div>
                </div>
                <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-slate-100 border border-slate-300 text-center">
                  <div className="text-lg font-bold text-slate-900">20%</div>
                  <div className="text-[10px] text-slate-600 font-medium">Semantik</div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              <span>Pelajari mekanisme evaluasi</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 2: Market Demand */}
          <div className="group p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-400 transition-[border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Peta Kebutuhan Pasar Nyata
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Agregasi frekuensi keahlian dari lowongan aktif. Pahami apa yang paling dicari rekruter saat ini.
              </p>

              {/* Progress bars */}
              <div className="space-y-2.5 pt-2">
                {marketSkills.slice(0, 3).map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>{item.name}</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-900 transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/insights"
                className="inline-flex items-center text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors"
              >
                <span>Lihat tren skill pasar</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Card 3: Job Application Tracker */}
          <div className="group p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-400 transition-[border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <BookmarkCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Pelacakan Lamaran Terstruktur
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kelola tahapan aplikasi kerja dalam 7 status seleksi, atur prioritas 1–5 bintang, dan bandingkan pilihan kariermu.
              </p>

              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Tersimpan</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Siapkan Berkas</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Sudah Melamar</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Wawancara</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Diterima</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Ditolak</span>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/tracker"
                className="inline-flex items-center text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors"
              >
                <span>Buka pelacakan lamaran</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Card 4: Actionable Learning Roadmap */}
          <div className="md:col-span-2 group p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-400 transition-[border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Rencana Belajar dari Kesenjangan Keahlian
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                SkillBridge mendeteksi persyaratan yang belum tercantum di CV-mu dan menghitung prioritas peningkatan berdasarkan frekuensi permintaan di industri.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Kualifikasi Terpenuhi</div>
                    <div className="text-[11px] text-slate-500">Terbukti dari isi dokumen CV atau konfirmasimu.</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Search className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Kebutuhan Peningkatan</div>
                    <div className="text-[11px] text-slate-500">Keahlian bernilai tinggi yang belum ada di CV-mu.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/progress"
                className="inline-flex items-center text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors"
              >
                <span>Lihat modul target belajar</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section Cara Kerja */}
      <section id="cara-kerja" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Alur Penggunaan
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-950 tracking-tight">
            Tiga Langkah Menemukan Peluang Terbaik
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-4">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Unggah dan Koreksi CV
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mendukung file PDF dan DOCX. Kamu dapat meninjau keahlian hasil ekstraksi, pengalaman kerja, dan latar belakang pendidikan sebelum analisis dihitung.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-4">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Tinjau Kesesuaian Kualifikasi
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem membandingkan kualifikasimu terhadap lowongan aktif dan mengelompokkannya menjadi <em>Cocok</em>, <em>Belum Ditemukan</em>, atau <em>Belum Cukup Bukti</em>.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-4">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Tutup Gap dan Pantau Lamaran
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fokus pada keahlian bernilai tinggi dan kelola kemajuan aplikasi kerjamu di kanban pelacakan lamaran hingga diterima.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Section CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Mulai Evaluasi Kesesuaian Kualifikasimu Hari Ini
            </h2>
            <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-normal">
              Daftar akun gratis dan dapatkan wawasan objektif tentang posisi keahlianmu di pasar kerja.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              {isAuthenticated && user ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold bg-white text-slate-950 hover:bg-slate-100 shadow-md transition-all duration-150"
                    rightIcon={<ArrowRight className="w-4 h-4 ml-1 text-slate-950" />}
                  >
                    Buka Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold bg-white text-slate-950 hover:bg-slate-100 shadow-md transition-[background-color,box-shadow] duration-150"
                      rightIcon={<ArrowRight className="w-4 h-4 ml-1 text-slate-950" />}
                    >
                      Coba dengan akun demo
                    </Button>
                  </Link>
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-medium border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800 transition-colors duration-150"
                    >
                      Masuk ke Akun
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
