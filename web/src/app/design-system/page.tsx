"use client";

import { showNotice } from "@/lib/dialogs";
import React, { useState } from "react";
import {
  Check,
  TrendingUp,
  Database,
  Briefcase,
  AlertCircle,
  Layers,
  Palette,
  Maximize2,
  SlidersHorizontal,
  Compass,
  Sparkles,
  Edit3,
} from "lucide-react";

import { ExampleResultCard } from "@/components/landing/hero-analysis-preview";
import { SkillChips } from "@/components/ui/skill-chips";
import { UI_COPY } from "@/lib/copy";
import { SkillBridgeLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { PixelBridge } from "@/components/ui/pixel-bridge";
import {
  TextInput,
  SearchInput,
  Select,
  Textarea,
  Checkbox,
} from "@/components/ui/input";
import {
  MatchBadge,
  CVSkillBadge,
} from "@/components/ui/badge";
import {
  Card,
  MetricCard,
  JobCard,
} from "@/components/ui/card";
import { FilterBar } from "@/components/ui/filter";
import type { FilterState } from "@/lib/job-filters";
import { DataTable, Column } from "@/components/ui/table";
import { MarketSkillBarChart, MarketSkillItem } from "@/components/ui/chart";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Spinner,
  SkeletonCard,
  SkeletonText,
  SkeletonTable,
} from "@/components/ui/loading";
import { AlertBanner, ErrorState } from "@/components/ui/error";

export default function DesignSystemPage() {
  // State interaktif untuk komponen demonstrasi
  const [searchValue, setSearchValue] = useState("");
  const [checkboxState, setCheckboxState] = useState(true);
  const [selectValue, setSelectValue] = useState("Data Analyst");
  const [filters, setFilters] = useState<FilterState>({
    role: "all",
    workType: "all",
    seniority: "all",
  });
  const [sortCol, setSortCol] = useState("skillName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [buttonLoading, setButtonLoading] = useState(false);

  // Data sampel untuk Market Skill Bar Chart
  const sampleMarketSkills: MarketSkillItem[] = [
    {
      skillName: "SQL",
      count: 24,
      percentage: 92,
      status: "found",
      exampleRequirement: "Menguasai query kompleks, window function, dan CTE di PostgreSQL",
    },
    {
      skillName: "Python",
      count: 20,
      percentage: 77,
      status: "found",
      exampleRequirement: "Manipulasi data menggunakan Pandas dan visualisasi Seaborn",
    },
    {
      skillName: "Tableau / Power BI",
      count: 18,
      percentage: 69,
      status: "missing",
      exampleRequirement: "Membangun dashboard bisnis interaktif untuk stakeholder eksekutif",
    },
    {
      skillName: "Microsoft Excel",
      count: 17,
      percentage: 65,
      status: "found",
      exampleRequirement: "Advanced formula, VLOOKUP, Pivot Table, and data modeling",
    },
    {
      skillName: "A/B Testing & Statistics",
      count: 12,
      percentage: 46,
      status: "missing",
      exampleRequirement: "Hypothesis testing, statistical significance, and cohort analysis",
    },
  ];

  // Data sampel untuk DataTable
  interface SkillRow {
    id: string;
    skillName: string;
    category: string;
    frequency: number;
    inCV: boolean;
  }

  const tableData: SkillRow[] = [
    { id: "1", skillName: "PostgreSQL", category: "Database", frequency: 24, inCV: true },
    { id: "2", skillName: "Python (Pandas)", category: "Programming", frequency: 20, inCV: true },
    { id: "3", skillName: "Power BI", category: "BI / Visualisasi", frequency: 18, inCV: false },
    { id: "4", skillName: "Excel Spreadsheets", category: "Analisis", frequency: 17, inCV: true },
    { id: "5", skillName: "Statistical Modeling", category: "Matematika", frequency: 12, inCV: false },
  ];

  const tableColumns: Column<SkillRow>[] = [
    {
      key: "skillName",
      header: "Nama Skill",
      sortable: true,
      render: (row) => <strong className="text-sb-navy">{row.skillName}</strong>,
    },
    {
      key: "category",
      header: "Kategori",
      sortable: true,
      render: (row) => (
        <span className="text-[11px] font-semibold px-stack-xs py-stack-3xs rounded-full bg-sb-mist-soft text-sb-navy border border-sb-border">
          {row.category}
        </span>
      ),
    },
    {
      key: "frequency",
      header: "Frekuensi (n)",
      align: "center",
      sortable: true,
      render: (row) => <span className="font-mono-metric font-bold text-sb-navy">{row.frequency}</span>,
    },
    {
      key: "inCV",
      header: "Status di CV",
      align: "right",
      render: (row) => (
        row.inCV ? (
          <span className="inline-flex items-center gap-stack-2xs text-sb-good font-semibold bg-emerald-50 px-stack-xs py-stack-3xs rounded-full border border-emerald-200">
            <Check className="w-3 h-3 text-sb-good" />
            Tercantum
          </span>
        ) : (
          <span className="text-sb-text-2 font-medium bg-sb-mist-faint px-stack-xs py-stack-3xs rounded-full border border-sb-border">
            Belum ditemukan
          </span>
        )
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-stack-md sm:px-stack-xl lg:px-stack-2xl py-stack-3xl space-y-stack-5xl">
      <section className="space-y-stack-md"><h2 className="text-2xl font-bold">{UI_COPY.landing.sceneExample}</h2><div className="grid sm:grid-cols-2 gap-stack-xl"><ExampleResultCard/><div className="space-y-stack-md"><SkillChips skills={[`${UI_COPY.landing.sceneGap} · ${UI_COPY.landing.sceneMissing}`]} gapClass="gap-stack-xs" chipClass="" variant="missing"/><div className="flex gap-stack-sm flex-wrap"><Button size="lg">{UI_COPY.landing.heroCtaPrimary}</Button><Button variant="secondary" size="lg">{UI_COPY.landing.heroCtaSecondary}</Button></div><div className="flex gap-stack-sm text-xs"><span className="bg-sb-good-soft text-sb-navy p-stack-sm rounded-lg">--sb-good-soft</span><span className="bg-sb-warning-soft text-sb-navy p-stack-sm rounded-lg">--sb-warning-soft</span></div></div></div></section>

      {/* --------------------------------------------------------------------- */}
      {/* Page Header */}
      {/* --------------------------------------------------------------------- */}
      <section className="page-banner rounded-3xl p-stack-xl sm:p-stack-3xl text-sb-navy relative overflow-hidden border border-sb-border shadow-2xs">
        <div className="relative z-10 space-y-stack-sm">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-sb-navy tracking-tight">
            Panduan Desain & Pustaka Komponen UI
          </h1>
          <p className="text-sm sm:text-base text-sb-text-2 max-w-3xl leading-relaxed">
            Identitas SkillBridge: Biru penghubung #1E40AF, Biru malam #111A2E, Putih sejuk #F4F6FA, dan Jingga peluang #D65B06. Tipografi Archivo untuk judul dan Onest untuk teks, gradient tipis hanya di latar halaman, serta status yang tidak hanya bergantung pada warna.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 1. Brand Identity & Logo */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-stack-xl">
        <div className="flex items-center gap-stack-xs pb-stack-xs border-b border-sb-border">
          <Layers className="w-5 h-5 text-sb-blue" />
          <h2 className="text-xl font-bold text-sb-navy tracking-tight">
            1. Identitas Brand, Logo, & Pixel Bridge Motif
          </h2>
        </div>
        <p className="text-xs text-sb-text-2">
          Logo SkillBridge merepresentasikan kompas navigasi karier dan jembatan talenta digital menuju masa depan ekonomi berkelanjutan.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-xl">
          <div className="glass-panel p-stack-xl rounded-2xl flex flex-col items-center justify-center gap-stack-sm">
            <span className="text-xs text-sb-text-2 font-mono-metric">Ukuran Besar (Large)</span>
            <SkillBridgeLogo size="lg" />
          </div>
          <div className="glass-panel p-stack-xl rounded-2xl flex flex-col items-center justify-center gap-stack-sm">
            <span className="text-xs text-sb-text-2 font-mono-metric">Ukuran Default (Medium)</span>
            <SkillBridgeLogo size="md" />
          </div>
          <div className="glass-panel p-stack-xl rounded-2xl flex flex-col items-center justify-center gap-stack-sm">
            <span className="text-xs text-sb-text-2 font-mono-metric">Ukuran Kecil (Small / Icon Only)</span>
            <div className="flex items-center gap-stack-md">
              <SkillBridgeLogo size="sm" />
              <SkillBridgeLogo size="md" showText={false} />
            </div>
          </div>
        </div>

        {/* Pixel Bridge Motif Variants */}
        <div className="space-y-stack-sm pt-stack-xs">
          <h3 className="text-sm font-bold text-sb-navy">Pixel Bridge Motif:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
            <div className="glass-panel p-stack-xl rounded-2xl space-y-stack-xs">
              <span className="text-xs text-sb-text-2 font-mono-metric">Varian Hero (32 Matrix)</span>
              <div className="overflow-x-auto py-stack-xs">
                <PixelBridge variant="hero" />
              </div>
            </div>
            <div className="glass-panel p-stack-xl rounded-2xl space-y-stack-xs">
              <span className="text-xs text-sb-text-2 font-mono-metric">Varian Divider & Compact</span>
              <div className="py-stack-xs space-y-stack-md">
                <PixelBridge variant="divider" />
                <div className="flex items-center gap-stack-xs">
                  <span className="text-xs text-sb-text-2">Compact:</span>
                  <PixelBridge variant="compact" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. Color Palette System */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-stack-xl">
        <div className="flex items-center gap-stack-xs pb-stack-xs border-b border-sb-border">
          <Palette className="w-5 h-5 text-sb-blue" />
          <h2 className="text-xl font-bold text-sb-navy tracking-tight">
            2. Palet Warna Baru (Navy, Blue, Sky, Mist System)
          </h2>
        </div>

        <div className="p-stack-md rounded-2xl bg-sb-mist-soft border border-sb-border text-xs text-sb-text-2 space-y-stack-xs leading-relaxed">
          <p className="font-bold text-sb-navy">
            Aturan Mutlak Penggunaan Palet Warna:
          </p>
          <ul className="list-disc list-inside space-y-stack-2xs">
            <li><strong>#111A2E (--sb-navy) dan #1E40AF (--sb-blue) BUKAN latar</strong>. Hanya dipakai untuk teks, ikon, link, garis, dan ring fokus.</li>
            <li><strong>Tombol primary:</strong> Latar <code className="bg-white/80 px-stack-2xs py-stack-3xs rounded text-sb-navy font-bold">--sb-sky</code>, teks <code className="bg-white/80 px-stack-2xs py-stack-3xs rounded text-sb-navy font-bold">--sb-navy</code> (kontras ±6:1), hover <code className="bg-white/80 px-stack-2xs py-stack-3xs rounded text-sb-navy font-bold">--sb-sky-hover</code>. Tidak boleh teks putih di atas --sb-sky.</li>
            <li><strong>Tombol secondary:</strong> Latar putih, border <code className="bg-white/80 px-stack-2xs py-stack-3xs rounded text-sb-navy">--sb-border</code>, teks <code className="bg-white/80 px-stack-2xs py-stack-3xs rounded text-sb-navy">--sb-navy</code>.</li>
            <li><strong>Nol Abu-Abu:</strong> Teks sekunder memakai <code className="bg-white/80 px-stack-2xs py-stack-3xs rounded text-sb-navy">--sb-text-2</code> (navy transparan 72%, kontras ±5:1). Tidak ada zinc/slate/gray.</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md">
          {/* Palet Utama */}
          <div className="space-y-stack-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sb-navy">
              Palet Utama
            </h4>
            <div className="space-y-stack-2xs text-xs font-mono-metric">
              <div className="h-10 rounded-xl bg-white border-2 border-sb-navy text-sb-navy flex items-center justify-between px-stack-sm font-bold shadow-xs">
                <span>--sb-navy (Teks Utama)</span>
                <span>#111A2E</span>
              </div>
              <div className="h-9 rounded-xl bg-white border-2 border-sb-blue text-sb-blue flex items-center justify-between px-stack-sm font-bold">
                <span>--sb-blue (Aksen & Link)</span>
                <span>#1E40AF</span>
              </div>
              <div className="h-9 rounded-xl bg-sb-sky text-sb-navy border border-sb-border flex items-center justify-between px-stack-sm font-bold">
                <span>--sb-sky (Tombol & Bar)</span>
                <span>#7B98E6</span>
              </div>
              <div className="h-9 rounded-xl bg-sb-mist text-sb-navy border border-sb-border flex items-center justify-between px-stack-sm font-bold">
                <span>--sb-mist (Chip & Track)</span>
                <span>#C3D1F4</span>
              </div>
            </div>
          </div>

          {/* Turunan Latar */}
          <div className="space-y-stack-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sb-navy">
              Turunan Latar Permukaan
            </h4>
            <div className="space-y-stack-2xs text-xs font-mono-metric">
              <div className="h-10 rounded-xl bg-sb-sky-hover text-sb-navy border border-sb-border flex items-center justify-between px-stack-sm font-semibold shadow-xs">
                <span>--sb-sky-hover</span>
                <span>#93ABEB</span>
              </div>
              <div className="h-9 rounded-xl bg-sb-mist-soft text-sb-navy border border-sb-border flex items-center justify-between px-stack-sm font-semibold">
                <span>--sb-mist-soft</span>
                <span>28% Mist</span>
              </div>
              <div className="h-9 rounded-xl bg-sb-mist-faint text-sb-navy border border-sb-border flex items-center justify-between px-stack-sm font-semibold">
                <span>--sb-mist-faint</span>
                <span>14% Mist</span>
              </div>
              <div className="h-9 rounded-xl bg-white text-sb-navy border border-sb-border flex items-center justify-between px-stack-sm font-semibold">
                <span>--sb-border</span>
                <span>14% Blue</span>
              </div>
            </div>
          </div>

          {/* Tipografi & Kontras */}
          <div className="space-y-stack-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sb-navy">
              Tipografi Navy Murni
            </h4>
            <div className="space-y-stack-2xs text-xs font-mono-metric">
              <div className="h-10 rounded-xl bg-sb-mist-soft text-sb-navy flex items-center justify-between px-stack-sm font-bold border border-sb-border">
                <span>--sb-text</span>
                <span>Navy 100%</span>
              </div>
              <div className="h-9 rounded-xl bg-sb-mist-soft text-sb-text-2 flex items-center justify-between px-stack-sm font-semibold border border-sb-border">
                <span>--sb-text-2</span>
                <span>Navy 72% (~5:1)</span>
              </div>
              <div className="h-9 rounded-xl bg-white text-sb-blue flex items-center justify-between px-stack-sm font-semibold border border-sb-border">
                <span>Link / Focus Ring</span>
                <span>#1E40AF</span>
              </div>
            </div>
          </div>

          {/* Status Semantik */}
          <div className="space-y-stack-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sb-navy">
              Status Semantik (Non-Warna)
            </h4>
            <div className="space-y-stack-2xs text-xs font-mono-metric">
              <div className="h-10 rounded-xl bg-emerald-50 text-sb-good border border-emerald-200 flex items-center justify-between px-stack-sm font-bold shadow-xs">
                <span>--sb-good (Cocok)</span>
                <span>#15803D</span>
              </div>
              <div className="h-9 rounded-xl bg-amber-50 text-sb-warning border border-amber-200 flex items-center justify-between px-stack-sm font-bold">
                <span>--sb-warning (Perlu Verifikasi)</span>
                <span>#B45309</span>
              </div>
              <div className="h-9 rounded-xl bg-rose-50 text-sb-critical border border-rose-200 flex items-center justify-between px-stack-sm font-bold">
                <span>--sb-critical (Belum Ada)</span>
                <span>#B91C1C</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. Score Ring / Circular Gauges */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-stack-xl">
        <div className="flex items-center gap-stack-xs pb-stack-xs border-b border-sb-border">
          <Sparkles className="w-5 h-5 text-sb-blue" />
          <h2 className="text-xl font-bold text-sb-navy tracking-tight">
            3. ScoreRing / Circular Gauges
          </h2>
        </div>
        <p className="text-xs text-sb-text-2">
          Komponen indikator skor melingkar dengan angka monospace dan gradien sesuai status skor (Good &ge; 75%, Warning &ge; 50%, Critical &lt; 50%).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-stack-xl">
          <div className="glass-panel p-stack-xl rounded-2xl flex flex-col items-center justify-center gap-stack-sm">
            <span className="text-xs text-sb-text-2 font-mono-metric">High Match (88% - Size LG)</span>
            <ScoreRing score={88} size="lg" />
          </div>
          <div className="glass-panel p-stack-xl rounded-2xl flex flex-col items-center justify-center gap-stack-sm">
            <span className="text-xs text-sb-text-2 font-mono-metric">Medium Match (64% - Size MD)</span>
            <ScoreRing score={64} size="md" />
          </div>
          <div className="glass-panel p-stack-xl rounded-2xl flex flex-col items-center justify-center gap-stack-sm">
            <span className="text-xs text-sb-text-2 font-mono-metric">Low Match (34% - Size SM)</span>
            <ScoreRing score={34} size="sm" />
          </div>
          <div className="glass-panel p-stack-xl rounded-2xl flex flex-col items-center justify-center gap-stack-sm">
            <span className="text-xs text-sb-text-2 font-mono-metric">Null / Belum Ada Skor</span>
            <ScoreRing score={null} size="md" />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. Buttons & Interactions */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-stack-xl">
        <div className="flex items-center gap-stack-xs pb-stack-xs border-b border-sb-border">
          <Compass className="w-5 h-5 text-sb-blue" />
          <h2 className="text-xl font-bold text-sb-navy tracking-tight">
            4. Tombol Interaktif (Pill-Shaped Buttons)
          </h2>
        </div>

        <div className="space-y-stack-md">
          <div className="flex flex-wrap items-center gap-stack-sm">
            <Button variant="primary" size="md">
              Primary Action
            </Button>
            <Button variant="secondary" size="md">
              Secondary Glass
            </Button>
            <Button variant="outline" size="md">
              Outline
            </Button>
            <Button variant="ghost" size="md">
              Ghost
            </Button>
            <Button variant="danger" size="md">
              Danger Action
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-stack-sm pt-stack-xs">
            <Button variant="primary" size="sm">
              Small Pill
            </Button>
            <Button variant="primary" size="md">
              Medium Pill
            </Button>
            <Button variant="primary" size="lg">
              Large Pill CTA
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={buttonLoading}
              onClick={() => {
                setButtonLoading(true);
                setTimeout(() => setButtonLoading(false), 2000);
              }}
            >
              Klik untuk Loading
            </Button>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. Inputs & Form Controls */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-stack-xl">
        <div className="flex items-center gap-stack-xs pb-stack-xs border-b border-sb-border">
          <Edit3 className="w-5 h-5 text-sb-blue" />
          <h2 className="text-xl font-bold text-sb-navy tracking-tight">
            5. Kontrol Input Form & Pencarian
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-stack-xl">
          <div className="space-y-stack-xs">
            <SearchInput
              label="Search Input"
              placeholder="Cari lowongan atau keahlian..."
              value={searchValue}
              onChange={(val) => setSearchValue(val)}
            />
          </div>
          <div className="space-y-stack-xs">
            <TextInput
              label="Text Input"
              placeholder="Nama lengkap atau kontak..."
            />
          </div>
          <div className="space-y-stack-xs">
            <Select
              label="Select Role"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              options={[
                { label: "Data Analyst", value: "Data Analyst" },
                { label: "Business Intelligence (BI) Analyst", value: "BI Analyst" },
              ]}
            />
          </div>
          <div className="sm:col-span-2 space-y-stack-xs">
            <Textarea
              label="Textarea Catatan"
              placeholder="Tambahkan catatan strategis lamaran kerjamu..."
              rows={3}
            />
          </div>
          <div className="flex items-center pt-stack-xl">
            <Checkbox
              label="Saya menyetujui pemrosesan data CV secara aman"
              checked={checkboxState}
              onChange={(e) => setCheckboxState(e.target.checked)}
            />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 6. Badges & Status Indicators */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-stack-xl">
        <div className="flex items-center gap-stack-xs pb-stack-xs border-b border-sb-border">
          <Check className="w-5 h-5 text-sb-blue" />
          <h2 className="text-xl font-bold text-sb-navy tracking-tight">
            6. Badges & Indikator Status Non-Warna
          </h2>
        </div>

        <div className="space-y-stack-md">
          <div className="space-y-stack-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sb-navy">
              Status Kesesuaian Lowongan (Figma MatchBadge)
            </h4>
            <div className="flex flex-wrap items-center gap-stack-sm">
              <MatchBadge status="match" score={88} />
              <MatchBadge status="underqualified" score={45} />
              <MatchBadge status="potentially_overqualified" score={92} />
              <MatchBadge status="insufficient_evidence" score={null} />
            </div>
          </div>

          <div className="space-y-stack-xs pt-stack-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sb-navy">
              Status Keberadaan Skill di CV
            </h4>
            <div className="flex flex-wrap items-center gap-stack-sm">
              <CVSkillBadge skillName="SQL" status="found" isMandatory />
              <CVSkillBadge skillName="Python" status="found" />
              <CVSkillBadge skillName="Tableau" status="missing" isMandatory />
              <CVSkillBadge skillName="Snowflake" status="needs_verification" />
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 7. Filter Controls */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-stack-xl">
        <div className="flex items-center gap-stack-xs pb-stack-xs border-b border-sb-border">
          <SlidersHorizontal className="w-5 h-5 text-sb-blue" />
          <h2 className="text-xl font-bold text-sb-navy tracking-tight">
            7. Kontrol Filter Dinamis
          </h2>
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          onReset={() =>
            setFilters({ role: "all", workType: "all", seniority: "all" })
          }
          sampleCount={26}
        />
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 8. Cards & Metric Displays */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-stack-xl">
        <div className="flex items-center gap-stack-xs pb-stack-xs border-b border-sb-border">
          <Maximize2 className="w-5 h-5 text-sb-blue" />
          <h2 className="text-xl font-bold text-sb-navy tracking-tight">
            8. Kartu Metrik & Kartu Lowongan Kerja (JobCard)
          </h2>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-stack-md">
          <MetricCard
            title="Total Lowongan Relevan"
            value="26"
            subtitle="Tersaring untuk berbagai role pekerjaan di Indonesia"
            icon={<Briefcase className="w-4 h-4" />}
            badge={
              <span className="text-[11px] font-semibold text-sb-good bg-emerald-50 px-stack-xs py-stack-3xs rounded-full border border-emerald-200 font-mono-metric">
                +4 baru
              </span>
            }
          />
          <MetricCard
            title="Kecocokan Rata-Rata CV"
            value="74%"
            subtitle="Berdasarkan 5 skill wajib yang telah dikonfirmasi"
            icon={<TrendingUp className="w-4 h-4" />}
            badge={<MatchBadge status="match" />}
          />
          <MetricCard
            title="Kebutuhan Skill Pasar"
            value="18"
            subtitle="Skill unik teridentifikasi dari lowongan aktif"
            icon={<Database className="w-4 h-4" />}
          />
        </div>

        {/* Job Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-xl pt-stack-xs">
          <JobCard
            id="job-demo-1"
            title="Junior Data Analyst"
            company="Nusantara FinTech"
            location="Jakarta (Hybrid)"
            employmentType="Full-time"
            seniority="Junior"
            sourceUrl="https://example.com"
            matchStatus="match"
            matchScore={88}
            matchedSkills={["SQL", "Python", "Excel"]}
            missingSkills={["Tableau"]}
            isSaved={true}
            onSaveToggle={() => {}}
            onViewDetails={() => {}}
          />

          <JobCard
            id="job-demo-2"
            title="Business Intelligence Analyst"
            company="Karya Logistik Express"
            location="Bandung (Onsite)"
            employmentType="Full-time"
            seniority="Mid"
            sourceUrl="https://example.com"
            matchStatus="underqualified"
            matchScore={52}
            matchedSkills={["SQL", "Excel"]}
            missingSkills={["Power BI", "A/B Testing", "Snowflake"]}
            isSaved={false}
            onSaveToggle={() => {}}
            onViewDetails={() => {}}
          />
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 9. Data Table */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-stack-xl">
        <div className="flex items-center gap-stack-xs pb-stack-xs border-b border-sb-border">
          <Database className="w-5 h-5 text-sb-blue" />
          <h2 className="text-xl font-bold text-sb-navy tracking-tight">
            9. Tabel Data (Responsive DataTable)
          </h2>
        </div>

        <DataTable
          columns={tableColumns}
          data={tableData}
          keyExtractor={(row) => row.id}
          sortColumn={sortCol}
          sortDirection={sortDir}
          onSort={(key) => {
            if (sortCol === key) {
              setSortDir(sortDir === "asc" ? "desc" : "asc");
            } else {
              setSortCol(key);
              setSortDir("asc");
            }
          }}
        />
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 10. Market Skill Insights Chart */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-stack-xl">
        <div className="flex items-center gap-stack-xs pb-stack-xs border-b border-sb-border">
          <TrendingUp className="w-5 h-5 text-sb-blue" />
          <h2 className="text-xl font-bold text-sb-navy tracking-tight">
            10. Visualisasi Chart Kebutuhan Pasar
          </h2>
        </div>

        <MarketSkillBarChart
          skills={sampleMarketSkills}
          totalSampleN={26}
          dataDate="November 2026"
          roleFilterLabel={filters.role}
          onAddLearning={(skill) => void showNotice(`Menambahkan ${skill} ke daftar target belajar`)}
        />
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 11. Empty States */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-stack-xl">
        <div className="flex items-center gap-stack-xs pb-stack-xs border-b border-sb-border">
          <AlertCircle className="w-5 h-5 text-sb-blue" />
          <h2 className="text-xl font-bold text-sb-navy tracking-tight">
            11. Kondisi Kosong (Empty State)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-xl">
          <EmptyState
            title="Tidak Ada Lowongan yang Cocok"
            description="Tidak ditemukan lowongan dengan filter aktif saat ini. Coba perluas lokasi atau ubah pilihan tipe kerja."
            actionLabel="Reset Semua Filter"
            onAction={() =>
              setFilters({ role: "all", workType: "all", seniority: "all" })
            }
          />
          <EmptyState
            title="Belum Ada Dokumen CV Diunggah"
            description="Unggah CV berformat PDF atau DOCX-mu untuk melihat pencocokan otomatis dan perbandingan top skill pasar."
            actionLabel="Unggah Dokumen CV Sekarang"
            onAction={() => {}}
          />
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 12. Loading States & Skeletons */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-stack-xl">
        <div className="flex items-center gap-stack-xs pb-stack-xs border-b border-sb-border">
          <Spinner size="sm" />
          <h2 className="text-xl font-bold text-sb-navy tracking-tight">
            12. Indikator Loading & Skeleton UI
          </h2>
        </div>

        <div className="space-y-stack-xl">
          <div className="flex flex-wrap items-center gap-stack-xl p-stack-md rounded-2xl glass-panel">
            <Spinner size="sm" label="Memproses data (Small)..." />
            <Spinner size="md" label="Menganalisis kecocokan (Medium)..." />
            <Spinner size="lg" label="Mengekstrak CV (Large)..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-xl">
            <div className="space-y-stack-xs">
              <span className="text-xs text-sb-text-2 font-mono-metric">Skeleton Card</span>
              <SkeletonCard />
            </div>
            <div className="space-y-stack-xs">
              <span className="text-xs text-sb-text-2 font-mono-metric">Skeleton Text & Blocks</span>
              <Card className="p-stack-xl space-y-stack-md">
                <SkeletonText lines={4} />
              </Card>
            </div>
          </div>

          <div className="space-y-stack-xs">
            <span className="text-xs text-sb-text-2 font-mono-metric">Skeleton Table Loading</span>
            <SkeletonTable rows={3} />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 13. Error & Alert Notifications */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-stack-xl pb-stack-4xl">
        <div className="flex items-center gap-stack-xs pb-stack-xs border-b border-sb-border">
          <AlertCircle className="w-5 h-5 text-sb-critical" />
          <h2 className="text-xl font-bold text-sb-navy tracking-tight">
            13. Notifikasi Error & Alert State
          </h2>
        </div>

        <div className="space-y-stack-md">
          <AlertBanner
            type="error"
            title="Gagal Membaca File Dokumen"
            message="Format file PDF terproteksi kata sandi atau tidak mengandung layer teks yang dapat diekstrak. Silakan coba unggah versi tanpa proteksi."
          />
          <AlertBanner
            type="warning"
            title="Batas Scraping Terdeteksi"
            message="Server LinkedIn merespons dengan kode 429 (Rate Limit). Worker telah berhenti secara elegan demi menjaga privasi dan integritas data."
          />
          <AlertBanner
            type="info"
            title="Data Sampel Demo Tersedia"
            message="Untuk kelancaran presentasi, seed data lokal telah terisi lengkap untuk berbagai bidang pekerjaan."
          />
          <AlertBanner
            type="success"
            title="Skill Berhasil Diperbarui"
            message="Perubahan daftar skill CV-mu telah disimpan. Skor kecocokan lowongan otomatis diperhitungkan ulang."
          />

          <div className="pt-stack-xs">
            <ErrorState
              title="Koneksi Layanan Terputus"
              message="Tidak dapat menjangkau server Supabase. Pastikan konfigurasi jaringan atau variabel lingkunganmu sudah benar."
              onRetry={() => void showNotice("Mencoba menghubungkan kembali...")}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
