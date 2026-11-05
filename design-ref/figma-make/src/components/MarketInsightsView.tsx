import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  Layers,
  Plus,
  Search,
  TrendingUp,
} from 'lucide-react';
import {
  CVProfile,
  JobListing,
  LearningPlanItem,
  RoleCategory,
  SKILL_DICTIONARY,
  calculateMarketSkillInsights,
} from '../data/skillBridgeData';
import { showFeedback } from '../utils/feedback';

interface MarketInsightsViewProps {
  jobs: JobListing[];
  activeCV: CVProfile;
  onUpdateCV: (updated: CVProfile) => void;
  selectedRole: RoleCategory;
  onSelectRole: (role: RoleCategory) => void;
  learningPlan: LearningPlanItem[];
  onAddToLearningPlan: (skillId: string, role: RoleCategory) => void;
  onNavigate: (
    tab: 'landing' | 'cv' | 'jobs' | 'insights' | 'progress' | 'admin'
  ) => void;
}

const ROLES: RoleCategory[] = [
  'Data Analyst',
  'BI Analyst',
  'Product Analyst',
  'UI/UX Designer',
];

export const MarketInsightsView: React.FC<MarketInsightsViewProps> = ({
  jobs,
  activeCV,
  onUpdateCV,
  selectedRole,
  onSelectRole,
  learningPlan,
  onAddToLearningPlan,
  onNavigate,
}) => {
  const [seniorityFilter, setSeniorityFilter] = useState<string>('Semua Senioritas');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  const searchSuggestions = useMemo(
    () =>
      Array.from(
        new Set([
          ...ROLES,
          ...jobs.map((job) => job.title),
        ])
      ).sort(),
    [jobs]
  );

  const filteredSampleJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (j.roleCategory !== selectedRole) return false;
      if (
        seniorityFilter !== 'Semua Senioritas' &&
        j.seniority !== seniorityFilter
      )
        return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchableText = `${j.roleCategory} ${j.title}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }
      return true;
    });
  }, [
    jobs,
    selectedRole,
    seniorityFilter,
    searchQuery,
  ]);

  const insights = useMemo(
    () => calculateMarketSkillInsights(filteredSampleJobs, activeCV),
    [filteredSampleJobs, activeCV]
  );

  const priorityToLearn = useMemo(
    () =>
      insights.filter(
        (item) =>
          item.cvStatus === 'missing' || item.cvStatus === 'insufficient'
      ),
    [insights]
  );

  return (
    <div className="mx-auto max-w-[1380px] px-7 py-10 sm:px-12 lg:px-20 xl:px-24 space-y-8">
      {/* TOP HERO BANNER */}
      <div className="page-hero rounded-3xl text-white p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Skill yang paling dibutuhkan pasar
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Bandingkan kebutuhan lowongan dengan skill yang sudah ada di CV kamu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('progress')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-950 font-bold text-xs sm:text-sm hover:bg-blue-50 transition-all shadow-md cursor-pointer"
            >
              <span>Lihat Rencana & Progres Belajar ({learningPlan.length})</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>

      </div>

      <div className="glass-panel rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_260px]">
          <label className="relative block">
            <span className="sr-only">Cari posisi, perusahaan, atau skill</span>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              list="insight-search-suggestions"
              value={searchQuery}
              onChange={(event) => {
                const value = event.target.value;
                setSearchQuery(value);
                const matchedRole = ROLES.find(
                  (role) => role.toLowerCase() === value.toLowerCase()
                );
                const matchedJob = jobs.find(
                  (job) => job.title.toLowerCase() === value.toLowerCase()
                );
                if (matchedRole) onSelectRole(matchedRole);
                else if (matchedJob) onSelectRole(matchedJob.roleCategory);
              }}
              placeholder="Cari posisi..."
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#3f5fbf] focus:ring-2 focus:ring-[#dbe5f4]"
            />
            <datalist id="insight-search-suggestions">
              {searchSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </label>

          <label>
            <span className="sr-only">Pilih senioritas</span>
            <select
              value={seniorityFilter}
              onChange={(event) => setSeniorityFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
            >
              <option value="Semua Senioritas">Semua Senioritas</option>
              <option value="Entry-Level">Entry-level (0–1 tahun)</option>
              <option value="Junior">Junior (1–3 tahun)</option>
              <option value="Mid-Level">Mid-level (3–5 tahun)</option>
              <option value="Senior">Senior (5+ tahun)</option>
            </select>
          </label>
        </div>
      </div>

      {/* TRANSPARENCY METADATA STRIP (FR-11 & NFR-03) */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-start sm:items-center gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            Hasil dihitung dari{' '}
            <strong className="text-slate-950">
              {filteredSampleJobs.length} lowongan
            </strong>{' '}
            untuk peran <strong>{selectedRole}</strong> dengan filter {seniorityFilter}.
            Dihitung per lowongan unik (bebas duplikasi kata dalam satu iklan).
          </span>
        </div>
        <span className="font-mono-metric text-[11px] font-bold text-blue-800 bg-white px-3 py-1 rounded-lg border border-blue-200 shrink-0">
          Pembaruan Dataset: 2 Nov 2026
        </span>
      </div>

      {filteredSampleJobs.length === 0 && (
        <div className="glass-panel rounded-2xl px-6 py-12 text-center">
          <h2 className="text-base font-extrabold text-slate-900">
            Tidak ada lowongan yang sesuai
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Coba ubah kata pencarian atau longgarkan salah satu filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSeniorityFilter('Semua Senioritas');
            }}
            className="gradient-button mt-5 rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer"
          >
            Reset filter
          </button>
        </div>
      )}

      {/* MAIN CONTENT GRID: BAR CHART TOP SKILLS (7 COLS) + PRIORITY LEARNING RECOMMENDATIONS (5 COLS) */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${
          filteredSampleJobs.length === 0 ? 'hidden' : ''
        }`}
      >
        {/* LEFT 7 COLS: TOP SKILLS BAR CHART & SYNONYM EVIDENCE (FR-07, FR-08, AC-03, AC-04) */}
        <div className="glass-panel lg:col-span-7 rounded-3xl p-6 sm:p-7 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Skill yang paling sering diminta untuk {selectedRole}
              </h2>
              <p className="text-xs text-slate-500">
                Klik pada baris skill untuk melihat sinonim yang dinormalisasi dan contoh kutipan
                persyaratan lowongan.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#238a7a]" />
                  80% ke atas: tinggi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#b7791f]" />
                  50–79%: sedang
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#c45555]" />
                  Di bawah 50%: rendah
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {insights.map((item, idx) => {
              const isExpanded = expandedSkillId === item.skillId;
              const inPlan = learningPlan.some(
                (p) =>
                  p.skillId === item.skillId &&
                  p.addedFromRole === selectedRole
              );
              const frequencyColor =
                item.percentage >= 80
                  ? '#238a7a'
                  : item.percentage >= 50
                    ? '#b7791f'
                    : '#c45555';

              return (
                <div
                  key={item.skillId}
                  className={`lift-card rounded-2xl border p-4 sm:p-5 space-y-3 transition-all ${
                    item.cvStatus === 'missing'
                      ? 'border-slate-200 border-l-4 border-l-[#c45555] bg-white/70'
                      : item.cvStatus === 'insufficient'
                        ? 'border-slate-200 border-l-4 border-l-[#b7791f] bg-white/70'
                        : 'border-slate-200 bg-slate-50/90'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono-metric text-xs font-bold inline-flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                          {item.canonicalName}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-xs font-bold bg-white px-3 py-1 rounded-xl border border-slate-200"
                        style={{ color: frequencyColor }}
                      >
                        {item.percentage}% · {item.postingCount} dari{' '}
                        {item.totalSampleJobs} lowongan
                      </span>
                    </div>
                  </div>

                  {/* Visual Gradient Frequency Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(10, item.percentage)}%`,
                          backgroundColor: frequencyColor,
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>
                        Wajib di <strong>{item.mandatoryCount}</strong> lowongan · Tambahan di{' '}
                        <strong>{item.optionalCount}</strong> lowongan
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSkillId(isExpanded ? null : item.skillId)
                        }
                        className="text-blue-700 font-bold hover:underline cursor-pointer"
                      >
                        {isExpanded
                          ? 'Sembunyikan Kutipan Lowongan'
                          : 'Lihat Contoh Kutipan Persyaratan'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Quotes & Quick Actions */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-200 space-y-2.5 text-xs">
                      <p className="text-slate-600">
                        Istilah serupa yang ikut dihitung: {item.synonyms.join(', ')}
                      </p>
                      <div className="font-bold text-slate-800">
                        Contoh Kutipan Persyaratan pada Sampel Lowongan:
                      </div>
                      {item.sampleQuotes.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1"
                        >
                          <div className="font-semibold text-slate-900">
                            {q.jobTitle} — <span className="text-slate-600">{q.company}</span>
                          </div>
                          <p className="text-slate-600 italic">&ldquo;{q.quote}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Footer for Missing / Unverified Skills */}
                  {item.cvStatus !== 'matched' && (
                    <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          item.cvStatus === 'missing'
                            ? 'text-[#c54d34]'
                            : 'text-[#8a621f]'
                        }`}
                      >
                        {item.cvStatus === 'missing'
                          ? 'Belum ditemukan di CV'
                          : 'Bukti di CV belum rinci'}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onAddToLearningPlan(item.skillId, selectedRole);
                          showFeedback('Skill ditambahkan ke tracker.');
                        }}
                        disabled={inPlan}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          inPlan
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        }`}
                      >
                        {inPlan ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tersimpan di Rencana Belajar</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah ke Rencana Belajar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT 5 COLS: PRIORITY LEARNING RECOMMENDATIONS & SYNONYM DICTIONARY (FR-09) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Priority Recommendations Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Prioritas belajar
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Skill yang perlu kamu perkuat
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Berdasarkan kebutuhan lowongan {selectedRole} yang belum memiliki bukti rinci di
                CV {activeCV.fullName}.
              </p>
            </div>

            {priorityToLearn.length === 0 ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-950 space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Semua skill utama sudah tercantum di CV</span>
                </div>
                <p>
                  Profil CV kamu telah mencakup keterampilan utama untuk posisi {selectedRole}.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {priorityToLearn.map((item) => {
                  const inPlan = learningPlan.some(
                    (p) =>
                      p.skillId === item.skillId &&
                      p.addedFromRole === selectedRole
                  );
                  return (
                    <div
                      key={item.skillId}
                      className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/60 border border-blue-200/90 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="mb-1 block text-[11px] font-bold text-[#3f5fbf]">
                            {item.priorityLevel} · Disebut di {item.percentage}% lowongan
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                            {item.canonicalName}
                          </h3>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />~
                          {item.estimatedStudyWeeks} minggu
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        <strong>Cara Membuktikan di CV:</strong> {item.recommendedProofAction}
                      </p>

                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            onAddToLearningPlan(item.skillId, selectedRole);
                            showFeedback('Skill ditambahkan ke tracker.');
                          }}
                          disabled={inPlan}
                          className={`w-full py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            inPlan
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {inPlan ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Sudah Masuk Daftar Belajar Saya</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Masukkan ke Rencana Belajar Saya</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Kamus Normalisasi Skill Preview (Section 7 Requirement) */}
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Bagian 7 • Kamus Normalisasi Skill
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Bagaimana SkillBridge Menyatukan Istilah & Sinonim?
              </h3>
              <p className="text-xs text-slate-600">
                Agar perhitungan frekuensi akurat, variasi penyebutan alat/teknologi dipetakan ke
                kelompok kompetensi kanonik:
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {SKILL_DICTIONARY.filter((d) =>
                d.rolesRelevant.includes(selectedRole)
              ).map((dict) => (
                <div
                  key={dict.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1"
                >
                  <div className="font-bold text-slate-900">
                    {dict.canonicalName}
                  </div>
                  <div className="text-slate-600">
                    <strong>Sinonim dipetakan:</strong> {dict.synonyms.join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
