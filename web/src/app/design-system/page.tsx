"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Search,
  Mail,
  Lock,
  ArrowRight,
  TrendingUp,
  Database,
  Briefcase,
  AlertCircle,
  Layers,
  Palette,
  Type,
  Maximize2,
  SlidersHorizontal,
} from "lucide-react";

import { SkillBridgeLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
  TextInput,
  SearchInput,
  Select,
  Textarea,
  Checkbox,
} from "@/components/ui/input";
import {
  Badge,
  MatchBadge,
  CVSkillBadge,
} from "@/components/ui/badge";
import {
  Card,
  MetricCard,
  JobCard,
} from "@/components/ui/card";
import { FilterBar, FilterState } from "@/components/ui/filter";
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
  const [filters, setFilters] = useState<FilterState>({
    role: "Data Analyst",
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
    {
      skillName: "Data Warehousing (BigQuery/Snowflake)",
      count: 9,
      percentage: 35,
      status: "needs_verification",
      exampleRequirement: "Familiar dengan arsitektur ELT dan pemodelan star-schema",
    },
  ];

  // Data sampel untuk DataTable
  interface SampleRow {
    [key: string]: unknown;
    id: string;
    skill: string;
    category: string;
    demand: string;
    frequency: number;
    inCV: boolean;
  }

  const tableData: SampleRow[] = [
    { id: "1", skill: "SQL (PostgreSQL)", category: "Database & Query", demand: "Sangat Tinggi", frequency: 24, inCV: true },
    { id: "2", skill: "Python (Pandas)", category: "Programming", demand: "Tinggi", frequency: 20, inCV: true },
    { id: "3", skill: "Power BI", category: "Business Intelligence", demand: "Tinggi", frequency: 18, inCV: false },
    { id: "4", skill: "Microsoft Excel", category: "Spreadsheet", demand: "Tinggi", frequency: 17, inCV: true },
    { id: "5", skill: "Google BigQuery", category: "Data Warehouse", demand: "Sedang", frequency: 9, inCV: false },
  ];

  const tableColumns: Column<SampleRow>[] = [
    {
      key: "skill",
      header: "Nama Skill",
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900">{row.skill}</span>,
    },
    {
      key: "category",
      header: "Kategori",
      sortable: true,
      render: (row) => <span className="text-slate-600">{row.category}</span>,
    },
    {
      key: "demand",
      header: "Tingkat Kebutuhan",
      sortable: true,
      render: (row) => (
        <Badge variant={row.demand === "Sangat Tinggi" ? "primary" : "secondary"}>
          {row.demand}
        </Badge>
      ),
    },
    {
      key: "frequency",
      header: "Frekuensi (n)",
      align: "center",
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-slate-800">{row.frequency}</span>,
    },
    {
      key: "inCV",
      header: "Status di CV",
      align: "right",
      render: (row) => (
        row.inCV ? (
          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ✓ Tercantum
          </span>
        ) : (
          <span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Belum ditemukan
          </span>
        )
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* --------------------------------------------------------------------- */}
      {/* Page Header */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-3 pb-8 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          SkillBridge Design System v1.0
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Panduan Desain & Pustaka Komponen UI
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Fondasi desain SkillBridge dirancang khusus untuk memenuhi standar kompetisi INVOFEST 2026: identitas biru-hijau yang profesional dan modern, tipografi yang tegas, tata letak responsif, serta kepatuhan penuh terhadap aksesibilitas status non-warna.
        </p>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 1. Brand Identity & Logo */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <Layers className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            1. Identitas Brand & Logo
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Logo SkillBridge merepresentasikan jembatan cerdas yang mengaitkan kompetensi pencari kerja (biru laut mendalam) dengan pertumbuhan peluang kerja nyata (hijau emerald).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 flex flex-col items-center justify-center gap-3">
            <span className="text-xs text-slate-400 font-mono">Ukuran Besar (Large)</span>
            <SkillBridgeLogo size="lg" />
          </Card>
          <Card className="p-6 flex flex-col items-center justify-center gap-3">
            <span className="text-xs text-slate-400 font-mono">Ukuran Default (Medium)</span>
            <SkillBridgeLogo size="md" />
          </Card>
          <Card className="p-6 flex flex-col items-center justify-center gap-3">
            <span className="text-xs text-slate-400 font-mono">Ukuran Kecil (Small / Icon Only)</span>
            <div className="flex items-center gap-4">
              <SkillBridgeLogo size="sm" />
              <SkillBridgeLogo size="md" showText={false} />
            </div>
          </Card>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. Color Palette System */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <Palette className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            2. Palet Warna (Color System)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Primary Blue */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Primary Blue (Trust & Intelligence)
            </h4>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="h-10 rounded-lg bg-blue-600 text-white flex items-center justify-between px-3 font-semibold shadow-xs">
                <span>blue-600</span>
                <span>#2563EB</span>
              </div>
              <div className="h-9 rounded-lg bg-blue-700 text-white flex items-center justify-between px-3">
                <span>blue-700</span>
                <span>#1D4ED8</span>
              </div>
              <div className="h-9 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-between px-3">
                <span>blue-50</span>
                <span>#EFF6FF</span>
              </div>
            </div>
          </div>

          {/* Emerald Green */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Growth Emerald (Match & Success)
            </h4>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-between px-3 font-semibold shadow-xs">
                <span>emerald-600</span>
                <span>#059669</span>
              </div>
              <div className="h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-between px-3">
                <span>emerald-500</span>
                <span>#10B981</span>
              </div>
              <div className="h-9 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center justify-between px-3">
                <span>emerald-50</span>
                <span>#ECFDF5</span>
              </div>
            </div>
          </div>

          {/* Slate Neutrals */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Slate Neutrals (Clarity & Surfaces)
            </h4>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="h-10 rounded-lg bg-slate-900 text-white flex items-center justify-between px-3 font-semibold">
                <span>slate-900</span>
                <span>#0F172A</span>
              </div>
              <div className="h-9 rounded-lg bg-slate-600 text-white flex items-center justify-between px-3">
                <span>slate-600</span>
                <span>#475569</span>
              </div>
              <div className="h-9 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-between px-3">
                <span>slate-100</span>
                <span>#F1F5F9</span>
              </div>
            </div>
          </div>

          {/* Semantic Accents */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Semantic Status (Guidance)
            </h4>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="h-10 rounded-lg bg-amber-500 text-white flex items-center justify-between px-3 font-semibold">
                <span>Underqualified</span>
                <span>#F59E0B</span>
              </div>
              <div className="h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-between px-3">
                <span>Overqualified</span>
                <span>#4F46E5</span>
              </div>
              <div className="h-9 rounded-lg bg-red-600 text-white flex items-center justify-between px-3">
                <span>Alert / Danger</span>
                <span>#DC2626</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. Typography & Spacing */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <Type className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            3. Tipografi & Skala Spacing
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Skala Tipografi
            </h4>
            <div className="space-y-3 divide-y divide-slate-100 text-slate-900">
              <div className="pt-2">
                <span className="text-xs text-slate-400 font-mono">Display (36px, font-extrabold)</span>
                <p className="text-3xl font-extrabold tracking-tight">Cari Karier Relevan</p>
              </div>
              <div className="pt-2">
                <span className="text-xs text-slate-400 font-mono">Heading 1 (24px, font-bold)</span>
                <p className="text-2xl font-bold tracking-tight">Market Skill Insights</p>
              </div>
              <div className="pt-2">
                <span className="text-xs text-slate-400 font-mono">Heading 2 (18px, font-bold)</span>
                <p className="text-lg font-bold">Kecocokan CV & Analisis Gap</p>
              </div>
              <div className="pt-2">
                <span className="text-xs text-slate-400 font-mono">Body Regular (14px, leading-relaxed)</span>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Skor kesesuaian dihitung transparan berdasarkan bukti konkret persyaratan wajib, skill tambahan, dan pengalaman.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Skala Grid & Spacing (Base 4px)
            </h4>
            <div className="space-y-2 text-xs font-mono text-slate-600">
              <div className="flex items-center gap-3">
                <span className="w-16">p-1 (4px)</span>
                <div className="h-3 w-4 bg-blue-500 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16">p-2 (8px)</span>
                <div className="h-3 w-8 bg-blue-500 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16">p-3 (12px)</span>
                <div className="h-3 w-12 bg-blue-500 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16">p-4 (16px)</span>
                <div className="h-3 w-16 bg-blue-500 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16">p-6 (24px)</span>
                <div className="h-3 w-24 bg-blue-500 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16">p-8 (32px)</span>
                <div className="h-3 w-32 bg-blue-500 rounded" />
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pt-2">
              Tata letak responsif menggunakan container fluida berpusat pada mobile (min-width 360px), tablet (sm: 640px, md: 768px), dan desktop (lg: 1024px, xl: 1280px).
            </p>
          </Card>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. Buttons & Interactive States */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <SlidersHorizontal className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            4. Komponen Tombol (Buttons)
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="success">Success / Simpan</Button>
            <Button variant="danger">Hapus Data</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="sm" variant="primary">Small (sm)</Button>
            <Button size="md" variant="primary">Medium (md)</Button>
            <Button size="lg" variant="primary">Large (lg)</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Dengan Left Icon
            </Button>
            <Button
              variant="outline"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Dengan Right Icon
            </Button>
            <Button
              variant="primary"
              isLoading={buttonLoading}
              onClick={() => {
                setButtonLoading(true);
                setTimeout(() => setButtonLoading(false), 1500);
              }}
            >
              {buttonLoading ? "Memproses..." : "Klik untuk Loading State"}
            </Button>
            <Button variant="primary" disabled>
              Disabled State
            </Button>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. Inputs & Form Controls */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <Search className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            5. Form & Komponen Input
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <SearchInput
              label="Pencarian Cepat"
              value={searchValue}
              onChange={setSearchValue}
              placeholder="Cari posisi kerja, skill, atau perusahaan..."
            />

            <TextInput
              label="Email Pelamar"
              placeholder="contoh@universitas.ac.id"
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Gunakan email aktif untuk verifikasi akun demo"
            />

            <TextInput
              label="Kata Sandi (Validasi Error)"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error="Kata sandi harus minimal 8 karakter dengan kombinasi angka"
            />
          </Card>

          <Card className="p-6 space-y-4">
            <Select
              label="Target Posisi Karier"
              options={[
                { label: "Data Analyst", value: "da" },
                { label: "Business Intelligence Analyst", value: "bi" },
                { label: "Junior Analytics Engineer", value: "ae" },
              ]}
            />

            <Textarea
              label="Koreksi Skill / Ringkasan Manual CV"
              placeholder="Tambahkan skill yang Anda kuasai namun belum tercantum di CV..."
              helperText="Skill tambahan akan ditandai sebagai klaim mandiri pengguna."
            />

            <Checkbox
              label="Setujui Pemrosesan Data CV"
              description="CV Anda diproses secara privat dan dapat dihapus permanen kapan pun (NFR-02)."
              defaultChecked
            />
          </Card>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 6. Badges & Status Indicators (Non-Color Compliant) */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            6. Badge & Indikator Status (Aksesibilitas Non-Warna)
          </h2>
        </div>

        <div className="space-y-6">
          {/* Status Kecocokan Lowongan */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Status Kecocokan Lowongan (FR-05 & AC-05)
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <MatchBadge status="match" score={88} />
              <MatchBadge status="underqualified" score={54} />
              <MatchBadge status="potentially_overqualified" score={92} />
              <MatchBadge status="insufficient_evidence" />
            </div>
          </div>

          {/* Status Skill CV */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Status Keberadaan Skill di CV (FR-06, FR-08, AC-04)
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <CVSkillBadge skillName="SQL" status="found" isMandatory />
              <CVSkillBadge skillName="Python" status="found" />
              <CVSkillBadge skillName="Tableau" status="missing" isMandatory />
              <CVSkillBadge skillName="Snowflake" status="needs_verification" />
            </div>
            <p className="text-xs text-slate-500">
              * Sesuai aturan: Gunakan label eksplisit <strong>&quot;Belum ditemukan&quot;</strong>, bukan &quot;tidak punya&quot;. Status ditampilkan dalam bentuk teks nyata, bukan semata-mata warna.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 7. Filter Controls */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <SlidersHorizontal className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            7. Kontrol Filter Dinamis (FR-01, FR-04, AC-03)
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
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <Maximize2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            8. Kartu Metrik & Kartu Lowongan Kerja (JobCard)
          </h2>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Total Lowongan Relevan"
            value="26"
            subtitle="Tersaring untuk Data Analyst di Indonesia"
            icon={<Briefcase className="w-4 h-4" />}
            badge={
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
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
            title="Kebutuhan Skill Pasar (N)"
            value="18"
            subtitle="Skill unik teridentifikasi dari lowongan aktif"
            icon={<Database className="w-4 h-4" />}
          />
        </div>

        {/* Job Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <JobCard
            id="job-demo-1"
            title="Junior Data Analyst"
            company="Nusantara FinTech"
            location="Jakarta (Hybrid)"
            employmentType="Full-time"
            seniority="Junior"
            sourceName="Greenhouse"
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
            sourceName="LinkedIn"
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
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
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
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            10. Visualisasi Chart Kebutuhan Pasar (FR-07, FR-08, AC-03)
          </h2>
        </div>

        <MarketSkillBarChart
          skills={sampleMarketSkills}
          totalSampleN={26}
          dataDate="November 2026"
          roleFilterLabel={filters.role}
          onAddLearning={(skill) => alert(`Menambahkan ${skill} ke daftar target belajar`)}
        />
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 11. Empty States */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            11. Kondisi Kosong (Empty State)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            description="Unggah CV berformat PDF atau DOCX Anda untuk melihat pencocokan otomatis dan perbandingan top skill pasar."
            actionLabel="Unggah Dokumen CV Sekarang"
            onAction={() => {}}
          />
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 12. Loading States & Skeletons */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <Spinner size="sm" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            12. Indikator Loading & Skeleton UI
          </h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-6 p-4 rounded-xl border border-slate-200 bg-white">
            <Spinner size="sm" label="Memproses data (Small)..." />
            <Spinner size="md" label="Menganalisis kecocokan (Medium)..." />
            <Spinner size="lg" label="Mengekstrak CV (Large)..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-mono">Skeleton Card</span>
              <SkeletonCard />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-mono">Skeleton Text & Blocks</span>
              <Card className="p-6 space-y-4">
                <SkeletonText lines={4} />
              </Card>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-mono">Skeleton Table Loading</span>
            <SkeletonTable rows={3} />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 13. Error & Alert Notifications */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-6 pb-12">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            13. Notifikasi Error & Alert State
          </h2>
        </div>

        <div className="space-y-4">
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
            message="Untuk kelancaran presentasi, seed data lokal telah terisi lengkap untuk role Data Analyst dan BI Analyst."
          />
          <AlertBanner
            type="success"
            title="Skill Berhasil Diperbarui"
            message="Perubahan daftar skill CV Anda telah disimpan. Skor kecocokan lowongan otomatis diperhitungkan ulang."
          />

          <div className="pt-2">
            <ErrorState
              title="Koneksi Layanan Terputus"
              message="Tidak dapat menjangkau server Supabase. Pastikan konfigurasi jaringan atau variabel lingkungan Anda sudah benar."
              onRetry={() => alert("Mencoba menghubungkan kembali...")}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
