import React, { useState } from "react";
import { X, ScanText, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInput, Textarea } from "@/components/ui/input";
import { PriorityStars } from "@/components/tracker/priority-stars";
import { SearchableJobCombobox } from "@/components/tracker/searchable-job-combobox";
import { TrackedJob, JobStage } from "@/types/tracker";

// =============================================================================
// 1. Edit Job Modal
// =============================================================================

interface EditJobModalProps {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-stack-md">
      <div className="bg-white rounded-2xl max-w-lg w-full p-stack-xl shadow-2xl space-y-stack-md border border-sb-border">
        <div className="flex items-center justify-between border-b border-sb-border pb-stack-sm">
          <div>
            <h3 className="text-base font-bold text-sb-navy">Perbarui Detail Pelacakan</h3>
            <p className="text-xs text-sb-text-2">
              {formData.title} • {formData.company}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sb-text-2 hover:text-sb-navy p-stack-2xs rounded-md cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-stack-md text-xs">
          {/* Stage */}
          <div>
            <label className="block font-semibold text-sb-navy mb-stack-2xs">Tahapan Lamaran</label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value as JobStage })}
              className="w-full py-stack-xs px-stack-sm rounded-xl border border-sb-border text-xs font-bold text-sb-navy focus:outline-hidden"
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
            <label className="block font-semibold text-sb-navy mb-stack-2xs">
              Prioritas (1–5 bintang)
            </label>
            <div className="flex items-center gap-stack-sm">
              <PriorityStars
                value={formData.priority}
                onChange={(val) => setFormData({ ...formData, priority: val })}
                size="lg"
              />
              <span className="text-xs font-bold text-sb-navy">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
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

          <div className="flex items-center justify-end gap-stack-xs pt-stack-sm border-t border-sb-border">
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

interface AddJobModalProps {
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
  const [ocrStatus, setOcrStatus] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [ocrMessage, setOcrMessage] = useState("");

  if (!isOpen) return null;

  /** Baca screenshot/poster lowongan lalu isi posisi, perusahaan, dan lokasi. */
  const readScreenshot = async (file: File) => {
    setOcrStatus("reading");
    setOcrMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/tracker/import-ocr", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.job) throw new Error(data.error || "Screenshot belum bisa dibaca.");
      const job = data.job as { title?: string; company?: string; location?: string };
      if (job.title) setManualTitle(job.title);
      if (job.company) setManualCompany(job.company);
      if (job.location) setManualLocation(job.location);
      setOcrStatus("done");
      setOcrMessage(
        job.company
          ? "Terisi dari screenshot. Periksa lagi sebelum menyimpan."
          : "Terisi dari screenshot, tapi nama perusahaan tidak terbaca. Lengkapi dulu sebelum menyimpan."
      );
    } catch (err) {
      setOcrStatus("error");
      setOcrMessage(err instanceof Error ? err.message : "Screenshot belum bisa dibaca.");
    }
  };

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
    setOcrStatus("idle");
    setOcrMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-stack-md">
      <div className="bg-white rounded-2xl max-w-lg w-full p-stack-xl shadow-2xl space-y-stack-md border border-sb-border">
        <div className="flex items-center justify-between border-b border-sb-border pb-stack-sm">
          <h3 className="text-base font-bold text-sb-navy">Tambah Lowongan Target</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sb-text-2 hover:text-sb-navy p-stack-2xs rounded-md cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-stack-md text-xs">
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
              <div className="relative flex py-stack-2xs items-center">
                <div className="flex-grow border-t border-sb-border" />
                <span className="shrink-0 px-stack-xs text-xs text-sb-text-2 font-medium">
                  atau isi sendiri
                </span>
                <div className="flex-grow border-t border-sb-border" />
              </div>

              <div className="rounded-xl border border-dashed border-sb-border bg-sb-mist-faint/60 p-stack-sm space-y-stack-xs">
                <label
                  className={`flex items-center gap-stack-sm ${ocrStatus === "reading" ? "cursor-wait" : "cursor-pointer"}`}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className="sr-only"
                    disabled={ocrStatus === "reading"}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void readScreenshot(file);
                    }}
                  />
                  <span className="w-9 h-9 rounded-lg bg-white border border-sb-border text-sb-blue flex items-center justify-center shrink-0">
                    {ocrStatus === "reading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-sb-navy">
                      {ocrStatus === "reading" ? "Membaca screenshot…" : "Isi otomatis dari screenshot"}
                    </span>
                    <span className="block text-sb-text-2">
                      Unggah screenshot atau poster lowongan (PNG, JPG, WEBP, PDF, maks. 10 MB).
                    </span>
                  </span>
                </label>
                {ocrMessage && (
                  <p
                    role="status"
                    className={`flex items-start gap-stack-2xs ${ocrStatus === "error" ? "text-red-700" : "text-sb-navy"}`}
                  >
                    {ocrStatus === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-sb-good shrink-0 mt-stack-3xs" />}
                    {ocrMessage}
                  </p>
                )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm pt-stack-xs">
            <div>
              <label className="block font-semibold text-sb-navy mb-stack-2xs">Tahapan awal</label>
              <select
                value={manualStage}
                onChange={(e) => setManualStage(e.target.value as JobStage)}
                className="w-full py-stack-xs px-stack-sm rounded-xl border border-sb-border text-xs font-semibold text-sb-navy focus:outline-hidden"
              >
                <option value="bookmarked">Tersimpan</option>
                <option value="applying">Siapkan Berkas</option>
                <option value="applied">Sudah Melamar</option>
                <option value="interviewing">Wawancara</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-sb-navy mb-stack-2xs">Prioritas</label>
              <div className="pt-stack-2xs">
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

          <div className="flex items-center justify-end gap-stack-xs pt-stack-sm border-t border-sb-border">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={ocrStatus === "reading" || (!selectedCatalogJobId && (!manualTitle.trim() || !manualCompany.trim()))}
            >
              Simpan lowongan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
