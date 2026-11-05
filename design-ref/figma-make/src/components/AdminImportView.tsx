import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Database,
  Edit3,
  FilePlus2,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  JobListing,
  RoleCategory,
  SKILL_DICTIONARY,
  SeniorityLevel,
  WorkType,
  getSkillById,
} from '../data/skillBridgeData';

interface AdminImportViewProps {
  jobs: JobListing[];
  onAddJob: (newJob: JobListing) => void;
  onUpdateJob: (updated: JobListing) => void;
  onDuplicateJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
}

export const AdminImportView: React.FC<AdminImportViewProps> = ({
  jobs,
  onAddJob,
  onUpdateJob,
  onDuplicateJob,
  onDeleteJob,
}) => {
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [adminBanner, setAdminBanner] = useState<string | null>(null);

  // Form state for Create / Edit
  const [title, setTitle] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [location, setLocation] = useState<string>('Jakarta Selatan');
  const [workType, setWorkType] = useState<WorkType>('Hybrid');
  const [seniority, setSeniority] = useState<SeniorityLevel>('Entry-Level');
  const [roleCategory, setRoleCategory] =
    useState<RoleCategory>('Data Analyst');
  const [minYearsExp, setMinYearsExp] = useState<number>(0);
  const [maxYearsExp, setMaxYearsExp] = useState<number>(2);
  const [sourcePlatform, setSourcePlatform] = useState<string>(
    'Input Kurasi Admin (Izin Resmi)'
  );
  const [sourceUrl, setSourceUrl] = useState<string>(
    'https://careers.example.id/jobs/new-opening'
  );
  const [selectedMandatoryIds, setSelectedMandatoryIds] = useState<string[]>([
    'sql',
    'excel',
    'dataviz',
  ]);

  const openCreateModal = () => {
    setEditingJobId(null);
    setTitle('Data Analyst — Marketplace & Commercial');
    setCompany('KreasiNusa Commerce');
    setLocation('Jakarta Selatan');
    setWorkType('Hybrid');
    setSeniority('Entry-Level');
    setRoleCategory('Data Analyst');
    setMinYearsExp(0);
    setMaxYearsExp(2);
    setSourcePlatform('Portal Karir Resmi KreasiNusa (Dataset Legal)');
    setSourceUrl('https://karir.kreasinusa.example.id/data-analyst');
    setSelectedMandatoryIds(['sql', 'excel', 'dataviz', 'communication']);
    setShowCreateForm(true);
  };

  const openEditModal = (job: JobListing) => {
    setEditingJobId(job.id);
    setTitle(job.title);
    setCompany(job.company);
    setLocation(job.location);
    setWorkType(job.workType);
    setSeniority(job.seniority);
    setRoleCategory(job.roleCategory);
    setMinYearsExp(job.minYearsExp);
    setMaxYearsExp(job.maxYearsExp);
    setSourcePlatform(job.sourcePlatform);
    setSourceUrl(job.sourceUrl);
    setSelectedMandatoryIds(job.mandatorySkills.map((s) => s.skillId));
    setShowCreateForm(true);
  };

  const toggleMandatorySkill = (skillId: string) => {
    if (selectedMandatoryIds.includes(skillId)) {
      if (selectedMandatoryIds.length > 1) {
        setSelectedMandatoryIds(
          selectedMandatoryIds.filter((id) => id !== skillId)
        );
      }
    } else {
      setSelectedMandatoryIds([...selectedMandatoryIds, skillId]);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const mandatorySkills = selectedMandatoryIds.map((skillId) => {
      const dict = getSkillById(skillId);
      return {
        skillId,
        rawMention: dict?.canonicalName || skillId,
        contextQuote: `Persyaratan wajib terkurasi admin untuk ${
          dict?.canonicalName || skillId
        }.`,
      };
    });

    if (editingJobId) {
      const existing = jobs.find((j) => j.id === editingJobId);
      if (existing) {
        onUpdateJob({
          ...existing,
          title,
          company,
          location,
          workType,
          seniority,
          roleCategory,
          minYearsExp,
          maxYearsExp,
          sourcePlatform,
          sourceUrl,
          mandatorySkills,
        });
        setAdminBanner(`Berhasil memperbarui data lowongan "${title}".`);
      }
    } else {
      const newJob: JobListing = {
        id: `job-custom-${Date.now()}`,
        title,
        company,
        industry: 'Teknologi & Ekonomi Digital',
        location,
        workType,
        seniority,
        roleCategory,
        minYearsExp,
        maxYearsExp,
        minEducation: 'S1 / D4',
        salaryRange: 'Rp 8.000.000 – Rp 11.500.000',
        postedDate: '2 November 2026',
        capturedDate: '2 November 2026',
        sourcePlatform,
        sourceUrl,
        isCuratedVerified: true,
        shortDescription:
          'Lowongan hasil kurasi admin yang telah melewati proses deduplikasi dan normalisasi kamus skill.',
        mandatorySkills,
        optionalSkills: [
          {
            skillId: 'python',
            rawMention: 'Python Dasar',
            contextQuote: 'Nilai tambah apabila menguasai dasar pemrograman Python.',
          },
        ],
      };
      onAddJob(newJob);
      setAdminBanner(
        `Berhasil menambahkan lowongan baru "${title}". Sampel N dan grafik Market Skill Insights otomatis diperbarui!`
      );
    }
    setShowCreateForm(false);
    setEditingJobId(null);
  };

  const handleBatchImportSample = () => {
    const batchJob: JobListing = {
      id: `job-import-${Date.now()}`,
      title: 'People & Workforce Data Analyst',
      company: 'Talenta Maju Indonesia',
      industry: 'HRTech & Konsultansi',
      location: 'Jakarta Pusat',
      workType: 'Remote',
      seniority: 'Junior',
      roleCategory: 'Data Analyst',
      minYearsExp: 1,
      maxYearsExp: 3,
      minEducation: 'S1 / D4',
      salaryRange: 'Rp 8.500.000 – Rp 12.000.000',
      postedDate: '2 November 2026',
      capturedDate: '2 November 2026',
      sourcePlatform: 'Impor Batch CSV Terverifikasi Admin',
      sourceUrl: 'https://talentamaju.example.id/careers/people-data-analyst',
      isCuratedVerified: true,
      shortDescription:
        'Menganalisis metrik retensi karyawan, efektivitas pelatihan, dan merancang dashboard SDM.',
      mandatorySkills: [
        {
          skillId: 'sql',
          rawMention: 'SQL Database',
          contextQuote: 'Wajib menguasai query SQL untuk penarikan data HRIS.',
        },
        {
          skillId: 'dataviz',
          rawMention: 'Power BI / Tableau',
          contextQuote: 'Wajib membuat dashboard metrik SDM bulanan.',
        },
        {
          skillId: 'excel',
          rawMention: 'Advanced Excel',
          contextQuote: 'Mahir mengolah data kompensasi dan evaluasi kinerja di Excel.',
        },
        {
          skillId: 'communication',
          rawMention: 'Presentasi Insight HR',
          contextQuote: 'Mampu menyampaikan rekomendasi kepada manajemen.',
        },
      ],
      optionalSkills: [
        {
          skillId: 'stats',
          rawMention: 'Analisis Statistik Survei Karyawan',
          contextQuote: 'Nilai tambah jika memahami pengolahan survei keterikatan karyawan.',
        },
      ],
    };
    onAddJob(batchJob);
    setAdminBanner(
      'Berhasil mengimpor 1 lowongan baru dari paket dataset CSV terkurasi ("People & Workforce Data Analyst").'
    );
  };

  return (
    <div className="mx-auto max-w-[1380px] px-7 py-10 sm:px-12 lg:px-20 xl:px-24 space-y-8">
      {/* TOP ADMIN HEADER */}
      <div className="page-hero rounded-3xl text-white p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Kelola katalog lowongan
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Tambah, perbarui, dan tinjau data lowongan serta pemetaan skill.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleBatchImportSample}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-blue-300/30 font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-blue-300" />
            <span>Impor Cepat Sampel CSV</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-950 font-bold text-xs sm:text-sm hover:bg-blue-50 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Tambah Lowongan Baru</span>
          </button>
        </div>
      </div>

      {adminBanner && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{adminBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdminBanner(null)}
            className="text-xs font-bold text-emerald-800 underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* CREATE / EDIT MODAL FORM */}
      {showCreateForm && (
        <form
          onSubmit={handleSaveForm}
          className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <FilePlus2 className="w-5 h-5 text-blue-600" />
              <span>
                {editingJobId
                  ? 'Edit Data Lowongan Terkurasi'
                  : 'Tambah Lowongan Baru ke Katalog'}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <label
                htmlFor="adm-title"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Judul Lowongan
              </label>
              <input
                id="adm-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
              />
            </div>

            <div>
              <label
                htmlFor="adm-company"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Perusahaan
              </label>
              <input
                id="adm-company"
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
              />
            </div>

            <div>
              <label
                htmlFor="adm-role"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Kategori Role
              </label>
              <select
                id="adm-role"
                value={roleCategory}
                onChange={(e) =>
                  setRoleCategory(e.target.value as RoleCategory)
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
              >
                <option value="Data Analyst">Data Analyst</option>
                <option value="BI Analyst">BI Analyst</option>
                <option value="Product Analyst">Product Analyst</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="adm-loc"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Lokasi Kota
              </label>
              <input
                id="adm-loc"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>

            <div>
              <label
                htmlFor="adm-wt"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Tipe Kerja
              </label>
              <select
                id="adm-wt"
                value={workType}
                onChange={(e) => setWorkType(e.target.value as WorkType)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50"
              >
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="adm-sen"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Level Senioritas
              </label>
              <select
                id="adm-sen"
                value={seniority}
                onChange={(e) =>
                  setSeniority(e.target.value as SeniorityLevel)
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50"
              >
                <option value="Entry-Level">Entry-Level</option>
                <option value="Junior">Junior</option>
                <option value="Mid-Level">Mid-Level</option>
              </select>
            </div>
          </div>

          {/* Mandatory Skills Checklist */}
          <div className="space-y-2">
            <span className="block text-xs font-bold text-slate-700">
              Pilih Persyaratan Skill Wajib (Terkoneksi dengan Kamus Normalisasi):
            </span>
            <div className="flex flex-wrap gap-2">
              {SKILL_DICTIONARY.map((dict) => {
                const checked = selectedMandatoryIds.includes(dict.id);
                return (
                  <button
                    key={dict.id}
                    type="button"
                    onClick={() => toggleMandatorySkill(dict.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      checked
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {checked ? 'Dipilih: ' : 'Pilih: '}
                    {dict.canonicalName}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label
                htmlFor="adm-src"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Nama Sumber Dataset Legal
              </label>
              <input
                id="adm-src"
                type="text"
                value={sourcePlatform}
                onChange={(e) => setSourcePlatform(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="adm-url"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                URL Bukti Sumber Lowongan
              </label>
              <input
                id="adm-url"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="gradient-button px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
            >
              {editingJobId ? 'Simpan Perubahan' : 'Simpan Lowongan Baru'}
            </button>
          </div>
        </form>
      )}

      {/* CURATED JOB CATALOG TABLE (FR-12: Edit, Duplicate, Delete) */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span>Katalog Data Lowongan Terkurasi (Total {jobs.length} lowongan)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Setiap perubahan langsung memperbarui perhitungan frekuensi pada halaman Market Skill
              Insights.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <th className="py-3 px-3">Judul & Perusahaan</th>
                <th className="py-3 px-3">Role & Level</th>
                <th className="py-3 px-3">Skill Wajib Terpetakan</th>
                <th className="py-3 px-3">Sumber & Akuisisi</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-900">{job.title}</div>
                    <div className="text-xs text-slate-500">
                      {job.company} • {job.location} ({job.workType})
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">
                      {job.roleCategory}
                    </span>
                    <div className="text-xs text-slate-500 mt-1">
                      {job.seniority} ({job.minYearsExp}–{job.maxYearsExp} thn)
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {job.mandatorySkills.map((s) => {
                        const d = getSkillById(s.skillId);
                        return (
                          <span
                            key={s.skillId}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                          >
                            {d?.canonicalName || s.rawMention}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-xs text-slate-600">
                    <div className="font-semibold text-slate-800 truncate max-w-[200px]">
                      {job.sourcePlatform}
                    </div>
                    <div className="text-slate-400">Diambil: {job.capturedDate}</div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(job)}
                        title="Edit Lowongan"
                        className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-all cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDuplicateJob(job.id);
                          setAdminBanner(
                            `Berhasil menduplikasi lowongan "${job.title}".`
                          );
                        }}
                        title="Duplikasi Lowongan"
                        className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-all cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteJob(job.id);
                          setAdminBanner(
                            `Lowongan "${job.title}" telah dihapus dari katalog.`
                          );
                        }}
                        title="Hapus Lowongan"
                        className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
