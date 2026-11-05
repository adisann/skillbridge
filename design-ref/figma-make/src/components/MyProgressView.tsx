import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Clock,
  Plus,
  Star,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  CVProfile,
  JobListing,
  JobTrackingEntry,
  JobTrackingStage,
  LearningPlanItem,
  RoleCategory,
  SKILL_DICTIONARY,
  evaluateJobMatch,
  getSkillById,
} from '../data/skillBridgeData';
import { ScoreGauge } from './StatusBadge';
import { showFeedback } from '../utils/feedback';

interface MyProgressViewProps {
  activeCV: CVProfile;
  onUpdateCV: (updated: CVProfile) => void;
  jobs: JobListing[];
  savedJobIds: string[];
  jobTracking: Record<string, JobTrackingEntry>;
  onUpdateJobTracking: (jobId: string, entry: JobTrackingEntry) => void;
  onToggleSaveJob: (jobId: string) => void;
  onOpenJobDetail: (jobId: string) => void;
  learningPlan: LearningPlanItem[];
  onAddToLearningPlan: (skillId: string, role: RoleCategory) => void;
  onUpdateLearningProgress: (
    itemId: string,
    progress: LearningPlanItem['progress']
  ) => void;
  onUpdateLearningNote: (itemId: string, note: string) => void;
  onRemoveFromLearningPlan: (itemId: string) => void;
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

export const MyProgressView: React.FC<MyProgressViewProps> = ({
  activeCV,
  onUpdateCV,
  jobs,
  savedJobIds,
  jobTracking,
  onUpdateJobTracking,
  onToggleSaveJob,
  onOpenJobDetail,
  learningPlan,
  onAddToLearningPlan,
  onUpdateLearningProgress,
  onUpdateLearningNote,
  onRemoveFromLearningPlan,
  onNavigate,
}) => {
  const [activeSection, setActiveSection] = useState<'skills' | 'jobs'>('skills');
  const [selectedRole, setSelectedRole] = useState<RoleCategory>(
    activeCV.targetRole
  );
  const [selectedSkill, setSelectedSkill] = useState(
    SKILL_DICTIONARY.find((skill) =>
      skill.rolesRelevant.includes(activeCV.targetRole)
    )?.id || SKILL_DICTIONARY[0].id
  );

  const savedJobs = jobs.filter((job) => savedJobIds.includes(job.id));
  const sortedSavedJobs = [...savedJobs].sort((a, b) => {
    const priorityDifference =
      (jobTracking[b.id]?.priority || 3) - (jobTracking[a.id]?.priority || 3);
    if (priorityDifference !== 0) return priorityDifference;
    return (
      evaluateJobMatch(activeCV, b).overallScore -
      evaluateJobMatch(activeCV, a).overallScore
    );
  });
  const activeTargets = useMemo(
    () =>
      ROLES.filter(
        (role) =>
          learningPlan.some((item) => item.addedFromRole === role) ||
          savedJobs.some((job) => job.roleCategory === role)
      ),
    [learningPlan, savedJobs]
  );

  const roleSkills = SKILL_DICTIONARY.filter((skill) =>
    skill.rolesRelevant.includes(selectedRole)
  );

  const addSkill = (event: React.FormEvent) => {
    event.preventDefault();
    onAddToLearningPlan(selectedSkill, selectedRole);
    showFeedback('Skill ditambahkan ke tracker.');
  };

  const promoteSkillToCV = (item: LearningPlanItem) => {
    const dictionary = getSkillById(item.skillId);
    const evidence =
      item.targetNote.trim() ||
      `Menyelesaikan proyek ${dictionary?.canonicalName || item.skillId}.`;
    const exists = activeCV.skills.some((skill) => skill.skillId === item.skillId);

    onUpdateCV({
      ...activeCV,
      skills: exists
        ? activeCV.skills.map((skill) =>
            skill.skillId === item.skillId
              ? { ...skill, evidenceState: 'proven', cvExcerpt: evidence }
              : skill
          )
        : [
            ...activeCV.skills,
            {
              skillId: item.skillId,
              evidenceState: 'proven',
              cvExcerpt: evidence,
              yearsUsed: 1,
            },
          ],
    });
    onUpdateLearningProgress(item.id, 'Siap Ditambahkan ke CV');
    showFeedback('Hasil belajar ditambahkan ke CV.');
  };

  return (
    <div className="min-h-[calc(100vh-76px)]">
      <div className="mx-auto max-w-[1380px] px-7 py-12 sm:px-12 lg:px-20 xl:px-24">
        <div className="page-hero rounded-[30px] px-7 py-9 text-white sm:px-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
                Progres karier
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#deddf3]">
                Kelola skill yang sedang dipelajari dan lowongan yang ingin kamu prioritaskan.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-white/10 px-4 py-2">
                {learningPlan.length} skill dilacak
              </span>
              <span className="rounded-full bg-white/10 px-4 py-2">
                {savedJobs.length} lowongan tersimpan
              </span>
            </div>
          </div>
        </div>

        {activeTargets.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold text-slate-500">Target aktif</span>
            {activeTargets.map((role) => (
              <span
                key={role}
                className="rounded-full border border-[#d5dfef] bg-white px-3 py-1.5 text-xs font-bold text-[#304a9f]"
              >
                {role}
              </span>
            ))}
          </div>
        )}

        <div className="glass-panel mt-8 rounded-2xl p-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSection('skills')}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${
                activeSection === 'skills'
                  ? 'bg-[#3f5fbf] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-[#f3f6fb] hover:text-[#304a9f]'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Skill
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  activeSection === 'skills'
                    ? 'bg-white/15 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {learningPlan.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('jobs')}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${
                activeSection === 'jobs'
                  ? 'bg-[#3f5fbf] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-[#f3f6fb] hover:text-[#304a9f]'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              Lamaran
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  activeSection === 'jobs'
                    ? 'bg-white/15 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {savedJobs.length}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-5">
          {activeSection === 'skills' && (
          <section className="glass-panel rounded-3xl p-6 sm:p-7">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#17172b]">
                  <BookOpen className="h-5 w-5 text-[#3f5fbf]" />
                  Tracker skill
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pantau progres belajar untuk setiap arah kariermu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('insights')}
                className="text-left text-xs font-bold text-[#304a9f] hover:underline cursor-pointer"
              >
                Lihat rekomendasi skill
              </button>
            </div>

            <form
              onSubmit={addSkill}
              className="mt-5 grid gap-3 rounded-2xl bg-[#f3f6fb] p-4 sm:grid-cols-[minmax(180px,.8fr)_minmax(260px,1.2fr)_auto]"
            >
              <label>
                <span className="mb-1.5 block text-xs font-bold text-slate-700">
                  Target pekerjaan
                </span>
                <select
                  value={selectedRole}
                  onChange={(event) => {
                    const role = event.target.value as RoleCategory;
                    setSelectedRole(role);
                    setSelectedSkill(
                      SKILL_DICTIONARY.find((skill) =>
                        skill.rolesRelevant.includes(role)
                      )?.id || SKILL_DICTIONARY[0].id
                    );
                  }}
                    className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold"
                >
                  {ROLES.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-slate-700">
                  Skill yang ingin dilacak
                </span>
                <select
                  value={selectedSkill}
                  onChange={(event) => setSelectedSkill(event.target.value)}
                  className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold"
                >
                  {roleSkills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.canonicalName}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="gradient-button inline-flex items-center justify-center gap-1.5 self-end rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Tambah
              </button>
            </form>

            {learningPlan.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm font-bold text-slate-700">Belum ada skill yang dilacak.</p>
                <p className="mt-1 text-xs text-slate-500">
                  Pilih target pekerjaan dan skill melalui form di atas.
                </p>
              </div>
            ) : (
              <div className="mt-7 space-y-8">
                {ROLES.filter((role) =>
                  learningPlan.some((item) => item.addedFromRole === role)
                ).map((role) => (
                  <div key={role}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-[#17172b]">{role}</h3>
                      <span className="text-xs text-slate-500">
                        {
                          learningPlan.filter((item) => item.addedFromRole === role)
                            .length
                        }{' '}
                        skill
                      </span>
                    </div>
                    <div className="space-y-3">
                      {learningPlan
                        .filter((item) => item.addedFromRole === role)
                        .map((item) => {
                          const dictionary = getSkillById(item.skillId);
                          const provenInCV = activeCV.skills.some(
                            (skill) =>
                              skill.skillId === item.skillId &&
                              skill.evidenceState === 'proven'
                          );
                          return (
                            <article
                              key={item.id}
                              className="glass-soft lift-card rounded-2xl p-4"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className="text-sm font-extrabold text-[#17172b]">
                                    {dictionary?.canonicalName || item.skillId}
                                  </h4>
                                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    Estimasi {dictionary?.estimatedStudyWeeks || 2} minggu
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onRemoveFromLearningPlan(item.id);
                                    showFeedback('Skill dihapus dari tracker.');
                                  }}
                                  aria-label={`Hapus ${dictionary?.canonicalName}`}
                                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
                                <select
                                  value={item.progress}
                                  onChange={(event) => {
                                    onUpdateLearningProgress(
                                      item.id,
                                      event.target.value as LearningPlanItem['progress']
                                    );
                                    showFeedback('Tahap belajar diperbarui.');
                                  }}
                                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700"
                                >
                                  <option value="Belum Mulai">Belum mulai</option>
                                  <option value="Sedang Dipelajari">Sedang dipelajari</option>
                                  <option value="Siap Ditambahkan ke CV">Selesai dipelajari</option>
                                </select>
                                <input
                                  value={item.targetNote}
                                  onChange={(event) =>
                                    onUpdateLearningNote(item.id, event.target.value)
                                  }
                                  placeholder="Catatan kursus atau proyek"
                                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-700"
                                />
                              </div>

                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                {provenInCV ? (
                                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                    <Check className="h-4 w-4" />
                                    Sudah tercantum di CV
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-500">
                                    Belum ada bukti proyek di CV
                                  </span>
                                )}
                                {!provenInCV && (
                                  <button
                                    type="button"
                                    onClick={() => promoteSkillToCV(item)}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#304a9f] hover:underline cursor-pointer"
                                  >
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Tambahkan hasil belajar ke CV
                                  </button>
                                )}
                              </div>
                            </article>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          )}

          {activeSection === 'jobs' && (
          <section className="glass-panel rounded-3xl p-6 sm:p-7">
            <div className="border-b border-slate-200 pb-5">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#17172b]">
                <Bookmark className="h-5 w-5 text-[#3f5fbf]" />
                Lowongan tersimpan
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Prioritas aplikasi berdasarkan skor terbaru.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#238a7a]" />
                Skor kuat
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#b7791f]" />
                Skor sedang
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#c45555]" />
                Perlu perhatian
              </span>
            </div>

            {savedJobs.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm font-bold text-slate-700">
                  Belum ada lowongan tersimpan.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('jobs')}
                  className="mt-3 text-xs font-bold text-[#304a9f] hover:underline cursor-pointer"
                >
                  Cari lowongan
                </button>
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {(['Tersimpan', 'Sudah Dilamar', 'Wawancara'] as JobTrackingStage[]).map(
                    (stage) => (
                      <div
                        key={stage}
                        className="rounded-xl bg-[#f3f6fb] px-2 py-3 text-center"
                      >
                        <div className="text-lg font-extrabold text-[#304a9f]">
                          {
                            savedJobs.filter(
                              (job) => (jobTracking[job.id]?.stage || 'Tersimpan') === stage
                            ).length
                          }
                        </div>
                        <div className="mt-0.5 text-[10px] font-semibold text-slate-500">
                          {stage}
                        </div>
                      </div>
                    )
                  )}
                </div>
                <div className="mt-4 space-y-3">
                {sortedSavedJobs.map((job) => {
                  const result = evaluateJobMatch(activeCV, job);
                  const tracking = jobTracking[job.id] || {
                    stage: 'Tersimpan' as JobTrackingStage,
                    priority: 3 as const,
                  };
                  const gaps = result.missingRequirements.filter(
                    (item) => item.importance === 'Wajib'
                  ).length;
                  return (
                    <article
                      key={job.id}
                      className="glass-soft lift-card rounded-2xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-[#3f5fbf]">
                            {job.roleCategory} · {job.seniority}
                          </p>
                          <h3 className="mt-1 text-sm font-extrabold leading-5 text-[#17172b]">
                            {job.title}
                          </h3>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {job.company} · {job.location}
                          </p>
                        </div>
                        <ScoreGauge
                          score={result.overallScore}
                          status={result.status}
                          size="sm"
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <span className="text-[11px] text-slate-500">
                          {gaps === 0
                            ? 'Syarat utama sesuai'
                            : `${gaps} skill utama perlu diperkuat`}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onToggleSaveJob(job.id);
                              showFeedback('Lowongan dihapus dari daftar tersimpan.');
                            }}
                            aria-label={`Hapus ${job.title} dari tersimpan`}
                            title="Hapus dari tersimpan"
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onOpenJobDetail(job.id);
                              onNavigate('jobs');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#eef3fb] px-3 py-2 text-xs font-bold text-[#304a9f] hover:bg-[#e4eaf5] cursor-pointer"
                          >
                            Detail
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                        <label>
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            Tahap aplikasi
                          </span>
                          <select
                            value={tracking.stage}
                            onChange={(event) => {
                              onUpdateJobTracking(job.id, {
                                ...tracking,
                                stage: event.target.value as JobTrackingStage,
                              });
                              showFeedback('Tahap aplikasi diperbarui.');
                            }}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-700"
                          >
                            <option value="Tersimpan">Tersimpan</option>
                            <option value="Akan Dilamar">Akan dilamar</option>
                            <option value="Sudah Dilamar">Sudah dilamar</option>
                            <option value="Wawancara">Wawancara</option>
                            <option value="Penawaran">Penawaran</option>
                            <option value="Diterima">Diterima</option>
                            <option value="Ditolak">Ditolak</option>
                          </select>
                        </label>
                        <div>
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            Prioritas
                          </span>
                          <div className="flex items-center gap-0.5" aria-label="Prioritas 1 sampai 5">
                            {([1, 2, 3, 4, 5] as const).map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => {
                                  onUpdateJobTracking(job.id, {
                                    ...tracking,
                                    priority: value,
                                  });
                                  showFeedback(`Prioritas diubah menjadi ${value} dari 5.`);
                                }}
                                aria-label={`Prioritas ${value}`}
                                className="p-1 cursor-pointer"
                              >
                                <Star
                                  className={`h-4 w-4 ${
                                    value <= tracking.priority
                                      ? 'fill-[#c45555] text-[#c45555]'
                                      : 'text-slate-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
                </div>
              </>
            )}
          </section>
          )}
        </div>
      </div>
    </div>
  );
};
