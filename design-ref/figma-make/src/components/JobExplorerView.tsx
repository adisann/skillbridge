import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Filter,
  HelpCircle,
  Info,
  MapPin,
  Plus,
  Search,
  Sliders,
  XCircle,
} from 'lucide-react';
import {
  CVProfile,
  DEFAULT_WEIGHTS,
  JobListing,
  LearningPlanItem,
  RoleCategory,
  ScoringWeights,
  evaluateJobMatch,
} from '../data/skillBridgeData';
import { MatchStatusBadge, ScoreGauge } from './StatusBadge';
import { showFeedback } from '../utils/feedback';

interface JobExplorerViewProps {
  jobs: JobListing[];
  activeCV: CVProfile;
  onSelectSampleCV: (cvId: string) => void;
  onUpdateCV: (updated: CVProfile) => void;
  selectedRole: RoleCategory | 'Semua Role';
  onSelectRole: (role: RoleCategory | 'Semua Role') => void;
  selectedWorkType: string;
  onSelectWorkType: (wt: string) => void;
  selectedJobId: string | null;
  onSelectJobId: (id: string) => void;
  savedJobIds: string[];
  onToggleSaveJob: (jobId: string) => void;
  learningPlan: LearningPlanItem[];
  onAddToLearningPlan: (skillId: string, role: RoleCategory) => void;
  onNavigate: (
    tab: 'landing' | 'cv' | 'jobs' | 'insights' | 'progress' | 'admin'
  ) => void;
}

export const JobExplorerView: React.FC<JobExplorerViewProps> = ({
  jobs,
  activeCV,
  onSelectSampleCV,
  onUpdateCV,
  selectedRole,
  onSelectRole,
  selectedWorkType,
  onSelectWorkType,
  selectedJobId,
  onSelectJobId,
  savedJobIds,
  onToggleSaveJob,
  learningPlan,
  onAddToLearningPlan,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedSeniority, setSelectedSeniority] =
    useState<string>('Semua Level');
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>('Semua Status');
  const [showWeightsConfig, setShowWeightsConfig] = useState<boolean>(false);
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);

  const uniqueLocations = useMemo(() => {
    const locs = Array.from(new Set(jobs.map((j) => j.location)));
    return locs;
  }, [jobs]);

  const searchSuggestions = useMemo(
    () => {
      const roleSkillCombinations = jobs.flatMap((job) =>
        [...job.mandatorySkills, ...job.optionalSkills].map(
          (skill) => `${job.roleCategory} ${skill.rawMention}`
        )
      );
      return Array.from(
        new Set([
          ...jobs.map((job) => job.roleCategory),
          ...jobs.map((job) => job.title),
          ...jobs.map((job) => job.company.trim()),
          ...jobs.flatMap((job) => [
            ...job.mandatorySkills.map((skill) => skill.rawMention),
            ...job.optionalSkills.map((skill) => skill.rawMention),
          ]),
          ...roleSkillCombinations,
        ])
      ).sort();
    },
    [jobs]
  );

  const evaluatedJobs = useMemo(() => {
    return jobs
      .map((job) => ({
        job,
        evaluation: evaluateJobMatch(activeCV, job, weights),
      }))
      .filter(({ job, evaluation }) => {
        if (selectedRole !== 'Semua Role' && job.roleCategory !== selectedRole) {
          return false;
        }
        if (
          selectedWorkType !== 'Semua Tipe' &&
          job.workType !== selectedWorkType
        ) {
          return false;
        }
        if (
          selectedLocation.trim() !== '' &&
          !job.location.toLowerCase().includes(selectedLocation.toLowerCase())
        ) {
          return false;
        }
        if (
          selectedSeniority !== 'Semua Level' &&
          job.seniority !== selectedSeniority
        ) {
          return false;
        }
        if (
          selectedStatusFilter !== 'Semua Status' &&
          evaluation.status !== selectedStatusFilter
        ) {
          return false;
        }
        if (searchQuery.trim() !== '') {
          const searchableText = [
            job.roleCategory,
            job.title,
            job.company,
            job.location,
            ...job.mandatorySkills.map((skill) => skill.rawMention),
            ...job.optionalSkills.map((skill) => skill.rawMention),
          ]
            .join(' ')
            .toLowerCase();
          const queryTokens = searchQuery
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .filter(Boolean);
          return queryTokens.every((token) => searchableText.includes(token));
        }
        return true;
      })
      .sort((a, b) => b.evaluation.overallScore - a.evaluation.overallScore);
  }, [
    jobs,
    activeCV,
    weights,
    selectedRole,
    selectedWorkType,
    selectedLocation,
    selectedSeniority,
    selectedStatusFilter,
    searchQuery,
  ]);

  const activePair =
    evaluatedJobs.find((item) => item.job.id === selectedJobId) ||
    evaluatedJobs[0] ||
    null;

  return (
    <div className="mx-auto max-w-[1380px] px-7 py-10 sm:px-12 lg:px-20 xl:px-24 space-y-6">
      <div className="page-hero rounded-3xl text-white p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Temukan lowongan yang paling sesuai
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl">
              Bandingkan kecocokan, persyaratan, dan skill yang perlu diperkuat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowWeightsConfig((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-blue-300/30 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-blue-300" />
              <span>Atur Bobot Skor</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('insights')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs sm:text-sm hover:bg-blue-50 transition-all cursor-pointer shadow-sm"
            >
              <span>Lihat insight skill</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>

      </div>

      {/* CONFIGURABLE SCORING WEIGHTS PANEL (Section 6 Requirement) */}
      {showWeightsConfig && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Atur bobot penilaian
              </h2>
              <p className="text-xs text-slate-600">
                Sesuaikan bobot di bawah untuk menguji sensitivitas estimasi kecocokan secara
                langsung.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWeights(DEFAULT_WEIGHTS)}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Kembalikan ke Default (55 / 15 / 20 / 10)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <label
                htmlFor="w-mandatory"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Skill Wajib ({weights.mandatorySkills}%)
              </label>
              <input
                id="w-mandatory"
                type="range"
                min={20}
                max={80}
                step={5}
                value={weights.mandatorySkills}
                onChange={(e) =>
                  setWeights({ ...weights, mandatorySkills: Number(e.target.value) })
                }
                className="w-full accent-blue-600"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <label
                htmlFor="w-optional"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Skill Tambahan ({weights.optionalSkills}%)
              </label>
              <input
                id="w-optional"
                type="range"
                min={5}
                max={40}
                step={5}
                value={weights.optionalSkills}
                onChange={(e) =>
                  setWeights({ ...weights, optionalSkills: Number(e.target.value) })
                }
                className="w-full accent-blue-600"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <label
                htmlFor="w-exp"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Pengalaman ({weights.experience}%)
              </label>
              <input
                id="w-exp"
                type="range"
                min={5}
                max={40}
                step={5}
                value={weights.experience}
                onChange={(e) =>
                  setWeights({ ...weights, experience: Number(e.target.value) })
                }
                className="w-full accent-blue-600"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <label
                htmlFor="w-edu"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Pendidikan ({weights.education}%)
              </label>
              <input
                id="w-edu"
                type="range"
                min={0}
                max={30}
                step={5}
                value={weights.education}
                onChange={(e) =>
                  setWeights({ ...weights, education: Number(e.target.value) })
                }
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* FILTER BAR (FR-01 & FR-04) */}
      <div className="glass-panel rounded-3xl p-5 space-y-4">
        <div className="flex flex-nowrap items-center gap-3 overflow-x-auto pb-1">
          {/* Search Keyword */}
          <div className="relative min-w-[340px] flex-1">
            <label htmlFor="job-search" className="sr-only">
              Cari judul lowongan, perusahaan, atau skill
            </label>
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="job-search"
              type="search"
              list="job-search-suggestions"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() && selectedRole !== 'Semua Role') {
                  onSelectRole('Semua Role');
                }
              }}
              placeholder="Cari posisi, perusahaan, atau skill..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <datalist id="job-search-suggestions">
              {searchSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>

          {/* Filter Location */}
          <div className="min-w-[180px]">
            <label htmlFor="filter-location" className="sr-only">
              Filter Lokasi
            </label>
            <input
              id="filter-location"
              type="search"
              list="job-location-suggestions"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              placeholder="Cari lokasi..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800"
            />
            <datalist id="job-location-suggestions">
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          {/* Filter Work Type */}
          <div className="min-w-[180px]">
            <label htmlFor="filter-worktype" className="sr-only">
              Filter Tipe Kerja
            </label>
            <select
              id="filter-worktype"
              value={selectedWorkType}
              onChange={(e) => onSelectWorkType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800"
            >
              <option value="Semua Tipe">Semua Tipe Kerja</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

          {/* Filter Seniority */}
          <div className="min-w-[200px]">
            <label htmlFor="filter-seniority" className="sr-only">
              Filter Level Senioritas
            </label>
            <select
              id="filter-seniority"
              value={selectedSeniority}
              onChange={(e) => setSelectedSeniority(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800"
            >
              <option value="Semua Level">Semua Senioritas</option>
              <option value="Entry-Level">Entry-level (0–1 tahun)</option>
              <option value="Junior">Junior (1–3 tahun)</option>
              <option value="Mid-Level">Mid-level (3–5 tahun)</option>
              <option value="Senior">Senior (5+ tahun)</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Status Indikatif:
            </span>
            {(
              [
                'Semua Status',
                'Match',
                'Underqualified',
                'Potentially Overqualified',
                'Insufficient Evidence',
              ] as const
            ).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                  selectedStatusFilter === st
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st === 'Semua Status'
                  ? 'Semua Status'
                  : st === 'Match'
                  ? 'Cocok'
                  : st === 'Underqualified'
                  ? 'Perlu penguatan'
                  : st === 'Potentially Overqualified'
                  ? 'Melampaui level'
                  : 'Bukti belum cukup'}
              </button>
            ))}
          </div>

          <span className="text-xs font-bold text-slate-700">
            Menampilkan {evaluatedJobs.length} lowongan
          </span>
        </div>
      </div>

      {/* MAIN MASTER-DETAIL LAYOUT: JOB LIST (LEFT 5 COLS) + TRANSPARENT JOB DETAIL (RIGHT 7 COLS) */}
      {evaluatedJobs.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">
            Tidak ada lowongan yang sesuai
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Coba ubah filter lokasi, senioritas, atau status indikatif di atas untuk melihat daftar
            lowongan yang tersedia.
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectRole('Semua Role');
              onSelectWorkType('Semua Tipe');
              setSelectedLocation('');
              setSelectedSeniority('Semua Level');
              setSelectedStatusFilter('Semua Status');
              setSearchQuery('');
            }}
            className="gradient-button px-4 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: JOB LISTINGS (FR-03) */}
          <div className="lg:col-span-5 space-y-3.5">
            {evaluatedJobs.map(({ job, evaluation }) => {
              const isSelected = activePair?.job.id === job.id;
              const isSaved = savedJobIds.includes(job.id);
              const mandatoryMissingCount = evaluation.missingRequirements.filter(
                (r) => r.importance === 'Wajib'
              ).length;

              return (
                <div
                  key={job.id}
                  onClick={() => onSelectJobId(job.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectJobId(job.id);
                    }
                  }}
                  className={`lift-card rounded-3xl p-5 transition-all cursor-pointer border-2 text-left space-y-3.5 ${
                    isSelected
                      ? 'bg-gradient-to-br from-white via-blue-50/50 to-blue-50/40 border-blue-600 shadow-md'
                      : 'bg-white border-slate-200/90 hover:border-blue-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                          {job.roleCategory}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {job.seniority} ({job.minYearsExp}–{job.maxYearsExp} thn)
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {job.title}
                      </h2>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{job.company}</span>
                      </p>
                    </div>

                    <ScoreGauge
                      score={evaluation.overallScore}
                      status={evaluation.status}
                      size="sm"
                    />
                  </div>

                  {/* Location, Work Type & Source Metadata (FR-03) */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location} ({job.workType})
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {job.postedDate}
                    </span>
                  </div>

                  {/* Status Badge & Quick Gap Counter */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <MatchStatusBadge status={evaluation.status} size="sm" />

                    <div className="flex items-center gap-2">
                      {mandatoryMissingCount > 0 ? (
                        <span className="text-xs font-semibold text-[#b44731]">
                          {mandatoryMissingCount} gap wajib
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-[#304a9f]">
                          Syarat wajib lengkap
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSaveJob(job.id);
                          showFeedback(
                            isSaved
                              ? 'Lowongan dihapus dari daftar tersimpan.'
                              : 'Lowongan disimpan ke tracker.'
                          );
                        }}
                        title={
                          isSaved
                            ? 'Hapus dari lowongan tersimpan'
                            : 'Simpan lowongan ini'
                        }
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: COMPREHENSIVE JOB DETAIL & EVIDENCE MATRIX (FR-05, FR-06, AC-02, AC-06) */}
          {activePair && (
            <div className="glass-panel lg:col-span-7 rounded-3xl p-6 sm:p-8 space-y-7 lg:sticky lg:top-24">
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                      {activePair.job.roleCategory}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      Level: {activePair.job.seniority} ({activePair.job.minYearsExp}–
                      {activePair.job.maxYearsExp} Tahun)
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#eef3fb] text-[#304a9f] text-xs font-semibold">
                      {activePair.job.salaryRange}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {activePair.job.title}
                  </h2>
                  <p className="text-sm text-slate-600 font-medium">
                    {activePair.job.company} • {activePair.job.industry} •{' '}
                    {activePair.job.location} ({activePair.job.workType})
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const wasSaved = savedJobIds.includes(activePair.job.id);
                      onToggleSaveJob(activePair.job.id);
                      showFeedback(
                        wasSaved
                          ? 'Lowongan dihapus dari daftar tersimpan.'
                          : 'Lowongan disimpan ke tracker.'
                      );
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                      savedJobIds.includes(activePair.job.id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {savedJobIds.includes(activePair.job.id) ? (
                      <>
                        <BookmarkCheck className="w-4 h-4" />
                        <span>Tersimpan</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" />
                        <span>Simpan Lowongan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SCORE BREAKDOWN & STATUS EXPLANATION CARD (FR-05 & NFR-03) */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/60 to-blue-50/40 border border-blue-200/80 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <MatchStatusBadge status={activePair.evaluation.status} size="md" />
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {activePair.evaluation.statusSummary}
                    </p>
                  </div>
                  <ScoreGauge
                    score={activePair.evaluation.overallScore}
                    status={activePair.evaluation.status}
                    size="lg"
                  />
                </div>

                {/* 4 Component Score Breakdown Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-blue-200/60 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div className="text-slate-500 font-medium">Skill Wajib</div>
                    <div className="font-mono-metric font-bold text-slate-900 text-sm mt-0.5">
                      {activePair.evaluation.componentBreakdown.mandatoryScore}/
                      {weights.mandatorySkills} poin
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div className="text-slate-500 font-medium">Skill Tambahan</div>
                    <div className="font-mono-metric font-bold text-slate-900 text-sm mt-0.5">
                      {activePair.evaluation.componentBreakdown.optionalScore}/
                      {weights.optionalSkills} poin
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div className="text-slate-500 font-medium">Pengalaman</div>
                    <div className="font-mono-metric font-bold text-slate-900 text-sm mt-0.5">
                      {activePair.evaluation.componentBreakdown.experienceScore}/
                      {weights.experience} poin
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div className="text-slate-500 font-medium">Pendidikan</div>
                    <div className="font-mono-metric font-bold text-slate-900 text-sm mt-0.5">
                      {activePair.evaluation.componentBreakdown.educationScore}/
                      {weights.education} poin
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#238a7a]" />
                    80–100: kuat
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#b7791f]" />
                    65–79: sedang
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#c45555]" />
                    Di bawah 65: perlu perhatian
                  </span>
                </div>

                {/* Supporting vs Reducing Factors (FR-05) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="glass-soft p-3.5 rounded-xl border-l-4 border-l-[#238a7a] space-y-1.5">
                    <div className="text-xs font-bold text-[#1f6f65] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#238a7a]" />
                      <span>Yang sudah sesuai</span>
                    </div>
                    <ul className="space-y-1 text-xs text-[#315f59] list-disc list-inside">
                      {activePair.evaluation.supportingFactors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="glass-soft p-3.5 rounded-xl border-l-4 border-l-[#b7791f] space-y-1.5">
                    <div className="text-xs font-bold text-[#8a5a18] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-[#b7791f]" />
                      <span>Yang perlu diperhatikan</span>
                    </div>
                    {activePair.evaluation.reducingFactors.length === 0 ? (
                      <p className="text-xs text-[#6f542d]">
                        Tidak ditemukan kekurangan pada persyaratan utama.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-xs text-[#6f542d] list-disc list-inside">
                        {activePair.evaluation.reducingFactors.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* 3-CATEGORY REQUIREMENT MATRIX: MATCHED, MISSING, INSUFFICIENT EVIDENCE (FR-06 & AC-02) */}
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Rincian persyaratan
                  </h3>
                  <span className="text-xs text-slate-500">
                    Dibandingkan dengan informasi di CV kamu
                  </span>
                </div>

                {/* Group 1: Belum Ditemukan di CV (Missing / Gap) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#b44731] flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-[#c45555]" />
                    <span>
                      Belum ditemukan di CV ({activePair.evaluation.missingRequirements.length})
                    </span>
                    </h4>
                    <span className="text-xs text-slate-500">
                      Tidak tertulis bukan berarti tidak mampu
                    </span>
                  </div>

                  {activePair.evaluation.missingRequirements.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#f3f2ff] border border-[#d5dfef] text-xs text-[#304a9f] font-medium">
                      Luar biasa! Seluruh keterampilan pada lowongan ini sudah tercantum di CV Anda.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activePair.evaluation.missingRequirements.map((req) => {
                        const inPlan = learningPlan.some(
                          (p) =>
                            p.skillId === req.skillId &&
                            p.addedFromRole === activePair.job.roleCategory
                        );
                        return (
                          <div
                            key={`${req.skillId}-${req.importance}`}
                            className="glass-soft rounded-2xl border-l-4 border-l-[#c45555] p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                    req.importance === 'Wajib'
                                      ? 'bg-[#c45555] text-white'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {req.importance}
                                </span>
                                <span className="font-bold text-slate-900 text-sm">
                                  {req.canonicalName}
                                </span>
                                </div>
                                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                                  {req.contextQuote}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  onAddToLearningPlan(
                                    req.skillId,
                                    activePair.job.roleCategory
                                  );
                                  showFeedback('Skill ditambahkan ke tracker.');
                                }}
                                disabled={inPlan}
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                                  inPlan
                                    ? 'bg-white text-[#304a9f] border border-[#d5dfef]'
                                    : 'bg-[#3f5fbf] hover:bg-[#304a9f] text-white'
                                }`}
                              >
                                {inPlan ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Sudah dilacak</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Lacak skill</span>
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

                {/* Group 2: Belum Cukup Bukti / Perlu Verifikasi (Insufficient Evidence) */}
                {activePair.evaluation.insufficientRequirements.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-[#8a5a18] flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#b7791f]" />
                      <span>
                        Bukti di CV belum rinci (
                        {activePair.evaluation.insufficientRequirements.length})
                      </span>
                    </h4>

                    <div className="space-y-2.5">
                      {activePair.evaluation.insufficientRequirements.map((req) => (
                        <div
                          key={`${req.skillId}-${req.importance}`}
                          className="glass-soft rounded-2xl border-l-4 border-l-[#b7791f] p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-[#ffe8bd] text-[#7a5019] text-[11px] font-bold uppercase">
                                Syarat {req.importance}
                              </span>
                              <span className="font-bold text-slate-900 text-sm">
                                {req.canonicalName}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-[#6f542d]">
                            <strong>Catatan Bukti CV:</strong> {req.cvEvidenceText}
                          </p>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => onNavigate('cv')}
                              className="text-xs font-bold text-[#304a9f] hover:underline cursor-pointer"
                            >
                              <span>Perbarui bukti di CV</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Group 3: Terbukti Cocok di CV (Matched) */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#1f6f65] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#238a7a]" />
                    <span>
                      Ditemukan di CV ({activePair.evaluation.matchedRequirements.length})
                    </span>
                  </h4>

                  {activePair.evaluation.matchedRequirements.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                      Belum ada persyaratan pada lowongan ini yang memiliki bukti kuat di CV.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {activePair.evaluation.matchedRequirements.map((req) => (
                        <div
                          key={`${req.skillId}-${req.importance}`}
                          title={req.cvEvidenceText}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2"
                        >
                          <CheckCircle2 className="h-4 w-4 text-[#238a7a]" />
                          <span className="text-xs font-bold text-[#1f6f65]">
                            {req.canonicalName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SOURCE METADATA & TRANSPARENCY FOOTER (FR-03, FR-11, AC-06) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Sumber lowongan</span>
                  </div>
                  <p>
                    Sumber: <strong>{activePair.job.sourcePlatform}</strong> • Tanggal Posting:{' '}
                    {activePair.job.postedDate} • Diambil pada: {activePair.job.capturedDate}
                  </p>
                </div>

                <a
                  href={activePair.job.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      `Membuka tautan sumber terkurasi:\n${activePair.job.sourceUrl}\n\nSumber: ${activePair.job.sourcePlatform}\nTanggal akuisisi dataset: ${activePair.job.capturedDate}`
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-slate-300 font-bold shrink-0 transition-all"
                >
                  <span>Buka Sumber Asli</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
