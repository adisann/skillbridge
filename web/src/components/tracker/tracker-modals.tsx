import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInput, Textarea } from "@/components/ui/input";
import { PriorityStars } from "@/components/tracker/priority-stars";
import { SearchableJobCombobox } from "@/components/tracker/searchable-job-combobox";
import { TrackedJob, JobStage } from "@/types/tracker";

// =============================================================================
// 1. Edit Job Modal
// =============================================================================

export interface EditJobModalProps {
  job: TrackedJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedJob: TrackedJob) => void;
}

export function EditJobModal({ job, isOpen, onClose, onSave }: EditJobModalProps) {
  if (!isOpen || !job) return null;

  return (
    <EditJobModalForm
      key={job.id}
      job={job}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function EditJobModalForm({
  job,
  onClose,
  onSave,
}: {
  job: TrackedJob;
  onClose: () => void;
  onSave: (updatedJob: TrackedJob) => void;
}) {
  const [formData, setFormData] = useState<TrackedJob>(job);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Perbarui Detail Pelacakan</h3>
            <p className="text-xs text-slate-500">
              {formData.title} • {formData.company}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Stage */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tahapan Lamaran</label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value as JobStage })}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="bookmarked">Tersimpan (Wishlist)</option>
              <option value="applying">Sedang Menyiapkan Berkas</option>
              <option value="applied">Sudah Melamar (Submitted)</option>
              <option value="interviewing">Tahap Wawancara / Tes Teknis</option>
              <option value="offered">Negosiasi / Penawaran (Offer)</option>
              <option value="accepted">Tawaran Diterima Resmi</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Prioritas (1–5 bintang)
            </label>
            <div className="flex items-center gap-3">
              <PriorityStars
                value={formData.priority}
                onChange={(val) => setFormData({ ...formData, priority: val })}
                size="lg"
              />
              <span className="text-xs font-bold text-slate-700">
                {formData.priority === 5
                  ? "Pilihan utama (5 bintang)"
                  : formData.priority === 4
                  ? "Prioritas tinggi (4 bintang)"
                  : formData.priority === 3
                  ? "Prioritas menengah (3 bintang)"
                  : "Prioritas standar"}
              </span>
            </div>
          </div>

          {/* Salary Expectation */}
          <TextInput
            label="Ekspektasi gaji"
            value={formData.salaryExpectation || ""}
            onChange={(e) => setFormData({ ...formData, salaryExpectation: e.target.value })}
            placeholder="Contoh: Rp 12 juta – Rp 16 juta"
          />

          {/* Date Applied & Interview Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput
              type="date"
              label="Tanggal Melamar"
              value={formData.dateApplied || ""}
              onChange={(e) => setFormData({ ...formData, dateApplied: e.target.value })}
            />
            <TextInput
              type="text"
              label="Jadwal Wawancara (Opsional)"
              value={formData.interviewDate || ""}
              onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
              placeholder="Contoh: Selasa, 10 Nov 14:00 WIB"
            />
          </div>

          {/* Notes */}
          <Textarea
            label="Catatan Pribadi & Strategi"
            rows={3}
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Catatan persiapan wawancara, nama recruiter, poin keunggulan CV-mu..."
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// 2. Add Job Modal
// =============================================================================

export interface AddJobModalProps {
  isOpen: boolean;
  catalogJobs: Array<{ id: string; title: string; company: string; location: string }>;
  onClose: () => void;
  onAddCatalogJob: (jobId: string, stage: JobStage, priority: number, salary: string) => void;
  onAddManualJob: (data: {
    title: string;
    company: string;
    location: string;
    stage: JobStage;
    priority: number;
    salary: string;
  }) => void;
}

export function AddJobModal({
  isOpen,
  catalogJobs,
  onClose,
  onAddCatalogJob,
  onAddManualJob,
}: AddJobModalProps) {
  const [selectedCatalogJobId, setSelectedCatalogJobId] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualLocation, setManualLocation] = useState("Indonesia (Hybrid)");
  const [manualSalary, setManualSalary] = useState("");
  const [manualPriority, setManualPriority] = useState(4);
  const [manualStage, setManualStage] = useState<JobStage>("bookmarked");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCatalogJobId) {
      onAddCatalogJob(selectedCatalogJobId, manualStage, manualPriority, manualSalary);
    } else if (manualTitle.trim() && manualCompany.trim()) {
      onAddManualJob({
        title: manualTitle.trim(),
        company: manualCompany.trim(),
        location: manualLocation.trim() || "Indonesia",
        stage: manualStage,
        priority: manualPriority,
        salary: manualSalary,
      });
    }

    // Reset form
    setSelectedCatalogJobId("");
    setManualTitle("");
    setManualCompany("");
    setManualSalary("");
    setManualPriority(4);
    setManualStage("bookmarked");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900">Tambah Lowongan Target</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <SearchableJobCombobox
            jobs={catalogJobs}
            selectedJobId={selectedCatalogJobId}
            onSelect={(job) => {
              if (job) {
                setSelectedCatalogJobId(job.id);
                setManualTitle(job.title);
                setManualCompany(job.company);
                setManualLocation(job.location);
              } else {
                setSelectedCatalogJobId("");
                setManualTitle("");
                setManualCompany("");
                setManualLocation("Indonesia (Hybrid)");
              }
            }}
          />

          {!selectedCatalogJobId && (
            <>
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="shrink-0 px-2 text-[10px] text-slate-400 font-medium">
                  atau isi manual
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <TextInput
                label="Posisi lowongan *"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Contoh: Senior Data Analyst"
              />

              <TextInput
                label="Nama perusahaan *"
                value={manualCompany}
                onChange={(e) => setManualCompany(e.target.value)}
                placeholder="Contoh: Tokopedia"
              />

              <TextInput
                label="Lokasi kerja"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                placeholder="Contoh: Jakarta (Hybrid)"
              />
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tahapan awal</label>
              <select
                value={manualStage}
                onChange={(e) => setManualStage(e.target.value as JobStage)}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="bookmarked">Tersimpan</option>
                <option value="applying">Siapkan Berkas</option>
                <option value="applied">Sudah Melamar</option>
                <option value="interviewing">Wawancara</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prioritas</label>
              <div className="pt-1.5">
                <PriorityStars
                  value={manualPriority}
                  onChange={(val) => setManualPriority(val)}
                  size="md"
                />
              </div>
            </div>
          </div>

          <TextInput
            label="Ekspektasi gaji"
            value={manualSalary}
            onChange={(e) => setManualSalary(e.target.value)}
            placeholder="Contoh: Rp 12 juta – Rp 16 juta"
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Simpan lowongan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
