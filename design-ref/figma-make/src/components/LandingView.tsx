import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  BriefcaseBusiness,
  Check,
  FileCheck2,
  FileText,
  MapPin,
  Search,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  CVProfile,
  JobListing,
  MarketSkillInsightItem,
  RoleCategory,
  evaluateJobMatch,
} from '../data/skillBridgeData';
import { ScoreGauge } from './StatusBadge';

interface LandingViewProps {
  activeCV: CVProfile;
  selectedRole: RoleCategory;
  onSelectRole: (role: RoleCategory) => void;
  selectedWorkType: string;
  onSelectWorkType: (workType: string) => void;
  onSelectSampleCV: (cvId: string) => void;
  onNavigate: (
    tab: 'landing' | 'cv' | 'jobs' | 'insights' | 'progress' | 'admin'
  ) => void;
  onOpenJobDetail: (jobId: string) => void;
  jobs: JobListing[];
  marketInsights: MarketSkillInsightItem[];
}

const ROLES: RoleCategory[] = [
  'Data Analyst',
  'BI Analyst',
  'Product Analyst',
  'UI/UX Designer',
];

type FeatureId = 'cv' | 'jobs' | 'insights' | 'progress';

export const LandingView: React.FC<LandingViewProps> = ({
  activeCV,
  selectedRole,
  onSelectRole,
  selectedWorkType,
  onSelectWorkType,
  onNavigate,
  onOpenJobDetail,
  jobs,
  marketInsights,
}) => {
  const [activeFeature, setActiveFeature] = useState<FeatureId>('cv');
  const roleJobs = jobs.filter((job) => job.roleCategory === selectedRole);
  const featuredJob = roleJobs[0] || jobs[0];
  const evaluation = evaluateJobMatch(activeCV, featuredJob);
  const topSkills = marketInsights.slice(0, 5);

  const featureTabs: Array<{
    id: FeatureId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    sectionId: string;
  }> = [
    { id: 'cv', label: 'Analisis CV', icon: FileText, sectionId: 'fitur-analisis-cv' },
    {
      id: 'jobs',
      label: 'Kecocokan Lowongan',
      icon: BriefcaseBusiness,
      sectionId: 'fitur-kecocokan',
    },
    {
      id: 'insights',
      label: 'Insight Skill',
      icon: BarChart3,
      sectionId: 'fitur-insight',
    },
    {
      id: 'progress',
      label: 'Progres Karier',
      icon: Bookmark,
      sectionId: 'fitur-progres',
    },
  ];

  return (
    <div className="overflow-hidden text-[#17172b]">
      <section className="relative">
        <div className="mx-auto max-w-[1380px] px-7 py-16 sm:px-12 sm:py-20 lg:px-20 lg:py-24 xl:px-24">
          <div className="grid min-h-[610px] items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
            <div className="max-w-[590px]">
              <p className="text-sm font-bold tracking-wide text-[#3f5fbf]">
                Platform karier berbasis kompetensi
              </p>
              <h1 className="mt-5 text-[42px] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#17172b] sm:text-5xl lg:text-[60px]">
                Karier yang tepat dimulai dari skill yang kamu punya.
              </h1>
              <p className="mt-7 max-w-[540px] text-base leading-8 text-[#64647a] sm:text-lg">
                Pahami kekuatan CV, temukan lowongan yang relevan, dan fokus belajar pada
                skill yang benar-benar dibutuhkan.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('cv')}
                  className="gradient-button inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-extrabold cursor-pointer"
                >
                  Mulai analisis CV
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('jobs')}
                  className="inline-flex items-center gap-2 rounded-full border border-[#aebbb8] bg-white px-7 py-4 text-sm font-bold text-[#17172b] transition hover:border-[#17172b] cursor-pointer"
                >
                  Jelajahi lowongan
                </button>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-[#6b6b7f]">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#3f5fbf]" />
                  Hasil mudah dipahami
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#3f5fbf]" />
                  Bisa dikoreksi
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#3f5fbf]" />
                  Data tetap privat
                </span>
              </div>
            </div>

            <div className="relative min-h-[540px]">
              <div className="absolute inset-y-0 right-[-120px] left-[12%] rounded-l-[64px] bg-[#3f5fbf]" />
              <div className="glass-panel absolute bottom-4 left-0 right-2 top-14 rounded-[28px]">
                <div className="flex h-14 items-center justify-between border-b border-[#e7e5ef] px-5 sm:px-7">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ef6b61]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#c45555]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#47b77b]" />
                  </div>
                  <span className="text-xs font-semibold text-[#7b7b8e]">CV Match Report</span>
                </div>

                <div className="grid h-[calc(100%-56px)] sm:grid-cols-[1.2fr_.8fr]">
                  <div className="border-b border-[#e7e5ef] p-6 sm:border-b-0 sm:border-r sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#3f5fbf]">
                      Posisi rekomendasi
                    </p>
                    <h2 className="mt-3 text-xl font-extrabold leading-snug text-[#17172b] sm:text-2xl">
                      {featuredJob.title}
                    </h2>
                    <p className="mt-2 text-sm font-medium text-[#64647a]">
                      {featuredJob.company}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-[#7b7b8e]">
                      <MapPin className="h-3.5 w-3.5" />
                      {featuredJob.location} · {featuredJob.workType}
                    </p>

                    <div className="mt-7 space-y-3">
                      {featuredJob.mandatorySkills.slice(0, 4).map((skill) => {
                        const matched = evaluation.matchedRequirements.some(
                          (item) => item.skillId === skill.skillId
                        );
                        return (
                          <div
                            key={skill.skillId}
                            className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f5fb] px-4 py-3"
                          >
                            <span className="text-xs font-bold text-[#2a2a42]">
                              {skill.rawMention}
                            </span>
                            <span
                              className={`text-[11px] font-bold ${
                                matched ? 'text-[#304a9f]' : 'text-[#b26412]'
                              }`}
                            >
                              {matched ? 'Sesuai' : 'Perlu diperkuat'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-[#f7f9f8] p-7 text-center">
                    <div className="rounded-full bg-white p-2 shadow-sm">
                      <ScoreGauge
                        score={evaluation.overallScore}
                        status={evaluation.status}
                        size="lg"
                      />
                    </div>
                    <p className="mt-5 text-sm font-extrabold text-[#17172b]">
                      Kecocokan CV
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[#737386]">
                      Skor dihitung dari skill, pengalaman, dan pendidikan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-[-14px] left-[-24px] max-w-[330px] rounded-2xl border border-[#d6d3ff] bg-[#eef3fb] p-4 shadow-xl sm:left-[-48px]">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#3f5fbf]">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-[#292954]">
                      Rekomendasi berikutnya
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#65658a]">
                      Tambahkan proyek dashboard agar bukti visualisasi data lebih kuat.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-header relative z-10 -mt-1 border-y">
        <div className="mx-auto max-w-[1380px] px-7 sm:px-12 lg:px-20 xl:px-24">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {featureTabs.map((feature) => {
              const Icon = feature.icon;
              const active = activeFeature === feature.id;
              return (
                <button
                  key={feature.id}
                  type="button"
                  onMouseEnter={() => setActiveFeature(feature.id)}
                  onFocus={() => setActiveFeature(feature.id)}
                  onClick={() => {
                    setActiveFeature(feature.id);
                    document
                      .getElementById(feature.sectionId)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`relative flex min-h-[108px] flex-col items-center justify-center gap-2 border-r border-[#e7e5ef] px-3 text-center transition cursor-pointer first:border-l ${
                    active ? 'bg-[#eef3f8] text-[#3f5fbf]' : 'bg-white text-[#777789]'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-bold sm:text-sm">{feature.label}</span>
                  {active && <span className="absolute inset-x-0 bottom-0 h-1 bg-[#3f5fbf]" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="fitur-analisis-cv" className="scroll-mt-24">
        <div className="mx-auto max-w-[1380px] px-7 py-24 sm:px-12 lg:px-20 lg:py-32 xl:px-24">
          <div className="grid items-center gap-16 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="max-w-[500px]">
              <p className="text-sm font-bold text-[#3f5fbf]">Analisis CV</p>
              <h2 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] text-[#17172b] sm:text-5xl">
                Tahu apa yang sudah kuat dan apa yang perlu diperbaiki.
              </h2>
              <p className="mt-6 text-base leading-8 text-[#64647a]">
                SkillBridge membaca skill, pengalaman, dan pendidikan di CV. Hasilnya tetap
                bisa kamu periksa dan koreksi sebelum digunakan.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('cv')}
                className="gradient-button mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-extrabold cursor-pointer"
              >
                Periksa CV
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="relative min-h-[520px]">
              <div className="absolute inset-y-0 right-[-120px] left-[18%] rounded-l-[56px] bg-[#efedff]" />
              <div className="glass-panel absolute inset-x-0 top-10 rounded-[26px] p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-[#e9e7f0] pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8eef8] text-[#3f5fbf]">
                      <FileCheck2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="max-w-[420px] truncate font-extrabold text-[#17172b]">
                        {activeCV.fileName}
                      </p>
                      <p className="mt-1 text-xs text-[#7b7b8e]">
                        {activeCV.skills.length} skill terdeteksi
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#e8eef8] px-3 py-1 text-xs font-bold text-[#304a9f]">
                    Siap ditinjau
                  </span>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {activeCV.skills.slice(0, 6).map((skill) => {
                    const names: Record<string, string> = {
                      sql: 'SQL & Database',
                      excel: 'Advanced Excel',
                      stats: 'Analisis Statistik',
                      communication: 'Data Storytelling',
                      python: 'Python',
                      dataviz: 'Visualisasi Data',
                      etl: 'Data Modeling',
                      abtesting: 'A/B Testing',
                    };
                    return (
                      <div
                        key={skill.skillId}
                        className="rounded-xl border border-[#e5e3f0] bg-[#faf9ff] p-4"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full ${
                              skill.evidenceState === 'proven'
                                ? 'bg-[#3f5fbf] text-white'
                                : 'bg-[#f6d77e] text-[#6f4a00]'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          <span className="text-xs font-extrabold text-[#2a2a42]">
                            {names[skill.skillId] || skill.skillId}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#7b7b8e]">
                          {skill.cvExcerpt}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fitur-kecocokan" className="page-hero scroll-mt-24 text-white">
        <div className="mx-auto max-w-[1380px] px-7 py-24 sm:px-12 lg:px-20 lg:py-32 xl:px-24">
          <div className="grid items-center gap-16 lg:grid-cols-[1.12fr_.88fr]">
            <div className="relative min-h-[530px] order-2 lg:order-1">
              <div className="absolute inset-y-0 left-[-120px] right-[18%] rounded-r-[56px] bg-[#3b82f6]" />
              <div className="glass-panel absolute inset-x-0 top-8 rounded-[26px] p-5 text-[#17172b] sm:p-7">
                <div className="flex items-center justify-between border-b border-[#e7e5ef] pb-4">
                  <div>
                    <p className="text-lg font-extrabold">Lowongan untuk {selectedRole}</p>
                    <p className="mt-1 text-xs text-[#7b7b8e]">
                      Diurutkan berdasarkan kecocokan CV
                    </p>
                  </div>
                  <Search className="h-5 w-5 text-[#777789]" />
                </div>
                <div className="mt-5 space-y-3">
                  {roleJobs.slice(0, 3).map((job) => {
                    const result = evaluateJobMatch(activeCV, job);
                    return (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => {
                          onOpenJobDetail(job.id);
                          onNavigate('jobs');
                        }}
                        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#e4e2ed] p-4 text-left transition hover:border-[#3f5fbf] cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[#17172b]">
                            {job.title}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#777789]">
                            {job.company} · {job.location}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#eef3fb] px-3 py-2 text-xs font-extrabold text-[#3f5fbf]">
                          {result.overallScore}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="max-w-[500px] order-1 lg:order-2 lg:justify-self-end">
              <p className="text-sm font-bold text-[#c9c7ff]">Kecocokan lowongan</p>
              <h2 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
                Pilih peluang berdasarkan bukti, bukan tebakan.
              </h2>
              <p className="mt-6 text-base leading-8 text-[#d9d8ea]">
                Setiap skor dilengkapi alasan yang jelas: skill yang cocok, informasi yang belum
                ditemukan, serta persyaratan yang perlu diperkuat.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('jobs')}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-[#172033] hover:bg-[#edf2f7] cursor-pointer"
              >
                Bandingkan lowongan
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="fitur-insight" className="scroll-mt-24">
        <div className="mx-auto max-w-[1380px] px-7 py-24 sm:px-12 lg:px-20 lg:py-32 xl:px-24">
          <div className="grid items-center gap-16 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="max-w-[500px]">
              <p className="text-sm font-bold text-[#3f5fbf]">Insight skill pasar</p>
              <h2 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] text-[#17172b] sm:text-5xl">
                Belajar lebih terarah dengan data lowongan nyata.
              </h2>
              <p className="mt-6 text-base leading-8 text-[#64647a]">
                Lihat skill yang paling sering diminta untuk posisi targetmu, lalu bandingkan
                dengan apa yang sudah tercantum di CV.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('insights')}
                className="gradient-button mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-extrabold cursor-pointer"
              >
                Lihat insight skill
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="relative min-h-[500px]">
              <div className="absolute inset-y-0 right-[-120px] left-[16%] rounded-l-[56px] bg-[#eeeaff]" />
              <div className="glass-panel absolute inset-x-0 top-8 rounded-[26px] p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-extrabold text-[#17172b]">
                      Skill teratas · {selectedRole}
                    </p>
                    <p className="mt-1 text-xs text-[#7b7b8e]">
                      Berdasarkan {roleJobs.length} lowongan terkurasi
                    </p>
                  </div>
                  <select
                    value={selectedRole}
                    onChange={(event) => onSelectRole(event.target.value as RoleCategory)}
                    className="rounded-xl border border-[#d5dcda] bg-white px-3 py-2 text-xs font-bold text-[#2a2a42]"
                  >
                    {ROLES.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-8 space-y-5">
                  {topSkills.map((skill, index) => (
                    <div key={skill.skillId}>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[#858598]">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="text-sm font-extrabold text-[#2a2a42]">
                            {skill.canonicalName}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-[#3f5fbf]">
                          {skill.percentage}%
                        </span>
                      </div>
                      <div className="ml-8 h-2.5 overflow-hidden rounded-full bg-[#e7e5ef]">
                        <div
                          className="h-full rounded-full bg-[#3f5fbf]"
                          style={{ width: `${skill.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fitur-progres" className="scroll-mt-24">
        <div className="mx-auto max-w-[1380px] px-7 py-24 sm:px-12 lg:px-20 xl:px-24">
          <div className="rounded-[40px] bg-[#eef3f8] px-7 py-14 sm:px-14 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-20 lg:py-16">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-[#17172b] sm:text-4xl">
                Pantau skill dan proses lamaran tanpa kehilangan arah.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#64647a]">
                Kelola target belajar, lowongan prioritas, tahap aplikasi, dan jadwal wawancara
                dalam satu alur yang mudah dipantau.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('progress')}
              className="mt-8 inline-flex shrink-0 items-center gap-2 rounded-full bg-[#17172b] px-7 py-4 text-sm font-extrabold text-white hover:bg-[#292954] lg:mt-0 cursor-pointer"
            >
              Lihat progres karier
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
