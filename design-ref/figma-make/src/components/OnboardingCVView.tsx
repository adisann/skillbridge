import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  CVProfile,
  RoleCategory,
  SAMPLE_CV_PROFILES,
  SKILL_DICTIONARY,
  getSkillById,
} from '../data/skillBridgeData';
import { showFeedback } from '../utils/feedback';

interface OnboardingCVViewProps {
  activeCV: CVProfile;
  onUpdateCV: (updated: CVProfile) => void;
  onSelectSampleCV: (sampleId: string) => void;
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

export const OnboardingCVView: React.FC<OnboardingCVViewProps> = ({
  activeCV,
  onUpdateCV,
  onSelectSampleCV,
  onNavigate,
}) => {
  const [privacyConsent, setPrivacyConsent] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showSamples, setShowSamples] = useState(false);
  const [selectedSkillToAdd, setSelectedSkillToAdd] = useState('dataviz');

  const availableSkills = SKILL_DICTIONARY.filter(
    (skill) => !activeCV.skills.some((item) => item.skillId === skill.id)
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadSuccess(null);

    if (!privacyConsent) {
      setUploadError('Setujui pemrosesan CV sebelum memilih file.');
      return;
    }

    const validFile = ['.pdf', '.docx', '.doc'].some((extension) =>
      file.name.toLowerCase().endsWith(extension)
    );
    if (!validFile) {
      setUploadError('Gunakan file PDF atau DOCX dengan ukuran maksimal 5 MB.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file melebihi 5 MB. Kompres dokumen lalu coba lagi.');
      return;
    }

    setIsExtracting(true);
    setTimeout(() => {
      setIsExtracting(false);
      onUpdateCV({
        ...activeCV,
        fileName: file.name,
        uploadedAt: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      });
      setUploadSuccess('CV berhasil dibaca. Periksa hasilnya sebelum melanjutkan.');
      showFeedback('CV berhasil dibaca.');
    }, 700);
  };

  const handleClearCV = () => {
    onUpdateCV({
      ...activeCV,
      fileName: 'Belum ada file',
      uploadedAt: '-',
      skills: [],
    });
    setUploadError(null);
    setUploadSuccess('CV dan hasil ekstraksi telah dihapus.');
    showFeedback('CV dan hasil ekstraksi dihapus.');
  };

  const handleAddSkill = (event: React.FormEvent) => {
    event.preventDefault();
    const skillId =
      availableSkills.find((skill) => skill.id === selectedSkillToAdd)?.id ||
      availableSkills[0]?.id;
    if (!skillId) return;

    const dictionary = getSkillById(skillId);
    onUpdateCV({
      ...activeCV,
      skills: [
        ...activeCV.skills,
        {
          skillId,
          evidenceState: 'self_claimed',
          cvExcerpt: `Ditambahkan oleh pengguna. Belum ada bukti ${dictionary?.canonicalName} yang tertulis di CV.`,
          yearsUsed: 1,
        },
      ],
    });
    showFeedback('Skill ditambahkan. Status bukti akan mengikuti isi CV.');
  };

  return (
    <div className="min-h-[calc(100vh-72px)]">
      <div className="mx-auto max-w-[1380px] px-7 py-12 sm:px-12 sm:py-16 lg:px-20 xl:px-24">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-slate-950">
            Mulai dari CV kamu.
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Unggah CV, lalu periksa skill dan pengalaman yang berhasil dibaca.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
          <aside className="space-y-5">
            <div className="glass-panel lift-card rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-slate-950">Unggah CV</h2>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSamples((value) => !value)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                  >
                    Coba CV sampel
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {showSamples && (
                    <div className="absolute right-0 top-7 z-20 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                      {SAMPLE_CV_PROFILES.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => {
                            onSelectSampleCV(sample.id);
                            setShowSamples(false);
                            setUploadSuccess('CV sampel dimuat. Kamu dapat mengubah hasilnya.');
                            showFeedback('CV sampel dimuat.');
                          }}
                          className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-slate-100 cursor-pointer"
                        >
                          <span className="block text-xs font-bold text-slate-900">
                            {sample.fullName}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-slate-500">
                            {sample.headline}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <label className="mt-5 block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center hover:border-blue-500 hover:bg-blue-50/40 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
                {isExtracting ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="mt-3 text-sm font-bold text-slate-900">
                      Membaca CV...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-sm font-bold text-slate-900">
                      Pilih file dari perangkat
                    </p>
                    <p className="mt-1 text-xs text-slate-500">PDF atau DOCX, maksimal 5 MB</p>
                  </>
                )}
              </label>

              <label className="mt-4 flex items-start gap-2.5 text-xs leading-5 text-slate-600">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(event) => setPrivacyConsent(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                Saya setuju CV diproses untuk analisis. Data tidak dipublikasikan.
              </label>

              {uploadError && (
                <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className="mt-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  {uploadSuccess}
                </div>
              )}

              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="truncate text-xs font-semibold text-slate-700">
                  {activeCV.fileName}
                </p>
                <button
                  type="button"
                  onClick={handleClearCV}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus CV
                </button>
              </div>
            </div>

            <div className="glass-panel lift-card rounded-2xl p-5">
              <h2 className="font-bold text-slate-950">Informasi pencocokan</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Posisi tujuan dan pengalaman yang terbaca dari CV.
              </p>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Posisi yang dituju
                </span>
                <select
                  value={activeCV.targetRole}
                  onChange={(event) =>
                    onUpdateCV({
                      ...activeCV,
                      targetRole: event.target.value as RoleCategory,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900"
                >
                  {ROLES.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Pengalaman yang tercantum di CV
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={activeCV.yearsOfExperience}
                    onChange={(event) =>
                      onUpdateCV({
                        ...activeCV,
                        yearsOfExperience: Math.max(0, Number(event.target.value)),
                      })
                    }
                    className="w-24 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold"
                  />
                  <span className="text-sm text-slate-600">tahun</span>
                </div>
                <span className="mt-2 block text-[11px] leading-4 text-slate-500">
                  Gunakan total pengalaman kerja relevan, bukan target pengalaman.
                </span>
              </label>
            </div>
          </aside>

          <section className="glass-panel rounded-2xl p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Tinjau skill dari CV</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Hapus atau tambahkan skill jika hasilnya belum sesuai.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Status bukti ditentukan otomatis dari isi CV, bukan dipilih manual.
                </p>
              </div>
              <span className="rounded-full bg-[#eef3fb] px-3 py-1 text-xs font-bold text-[#304a9f]">
                {activeCV.skills.length} skill ditemukan
              </span>
            </div>

            <div className="mt-5">
              {activeCV.skills.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-5 py-10 text-center">
                  <FileText className="mx-auto h-7 w-7 text-slate-400" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Belum ada skill yang ditemukan.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2.5">
                    {activeCV.skills.map((skill) => {
                      const dictionary = getSkillById(skill.skillId);
                      const statusColor =
                        skill.evidenceState === 'proven'
                          ? 'bg-emerald-500'
                          : skill.evidenceState === 'unverified'
                            ? 'bg-[#b7791f]'
                            : 'bg-slate-400';
                      const statusLabel =
                        skill.evidenceState === 'proven'
                          ? 'Ada bukti'
                          : skill.evidenceState === 'unverified'
                            ? 'Bukti belum rinci'
                            : 'Ditambahkan manual';
                      return (
                        <div
                          key={skill.skillId}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
                        >
                          <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                          <span className="text-xs font-bold text-slate-800">
                            {dictionary?.canonicalName || skill.skillId}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {statusLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateCV({
                                ...activeCV,
                                skills: activeCV.skills.filter(
                                  (item) => item.skillId !== skill.skillId
                                ),
                              });
                              showFeedback('Skill dihapus dari daftar CV.');
                            }}
                            aria-label={`Hapus ${dictionary?.canonicalName}`}
                            className="text-slate-400 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Bukti ditemukan di CV
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#b7791f]" />
                      Bukti di CV belum rinci
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      Ditambahkan pengguna
                    </span>
                  </div>
                </>
              )}
            </div>

            {availableSkills.length > 0 && (
              <form
                onSubmit={handleAddSkill}
                className="mt-6 flex flex-col gap-3 rounded-xl bg-[#f7f9fc] p-4 sm:flex-row sm:items-end"
              >
                <label className="flex-1">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Tambahkan skill
                  </span>
                  <select
                    value={selectedSkillToAdd}
                    onChange={(event) => setSelectedSkillToAdd(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold"
                  >
                    {availableSkills.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.canonicalName}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="gradient-button inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Tambah
                </button>
              </form>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                Pastikan informasi di atas sudah sesuai sebelum melanjutkan.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('jobs')}
                className="gradient-button inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold cursor-pointer"
              >
                Lihat kecocokan lowongan
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
