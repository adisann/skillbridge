import { confirmAction } from "@/lib/dialogs";
import { useState } from "react";
import { useAsyncTask } from "@/context/async-task-context";
import {
  DEFAULT_JOB_FORM,
  buildCreatePayload,
  buildDuplicatePayload,
  buildPayloadFromCsvRow,
  buildUpdatePayload,
  formFromAdminJob,
  formFromExtractedJob,
} from "@/lib/admin-jobs";
import type { AdminJob, AdminNotification, ExtractedJob, JobFormValues } from "@/types/admin";

interface UseAdminJobActionsOptions {
  refetch: () => Promise<void>;
  notify: (notification: AdminNotification) => void;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

function postJson(url: string, body: unknown, method: "POST" | "PUT" = "POST") {
  return fetch(url, { method, headers: JSON_HEADERS, body: JSON.stringify(body) });
}

function errorMessage(err: unknown): string {
  return (err as Error).message;
}

/** Aksi admin untuk lowongan: tambah, ekstraksi URL/OCR, edit, hapus, duplikasi, dan impor CSV. */
export function useAdminJobActions({ refetch, notify }: UseAdminJobActionsOptions) {
  const { runTask } = useAsyncTask();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<JobFormValues>(DEFAULT_JOB_FORM);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState<JobFormValues>(DEFAULT_JOB_FORM);

  const [showUrlModal, setShowUrlModal] = useState(false);
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [isExtractingOcr, setIsExtractingOcr] = useState(false);

  /** Menjalankan operasi admin yang menampilkan notifikasi sukses/gagal dan memuat ulang data. */
  const runSubmit = async (action: () => Promise<string | undefined>) => {
    setIsSubmitting(true);
    try {
      const message = await action();
      if (message) notify({ type: "success", message });
      refetch();
    } catch (err: unknown) {
      notify({ type: "error", message: errorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewExtractedJob = (job: unknown) => {
    if (job && typeof job === "object") {
      setAddForm(formFromExtractedJob(job as ExtractedJob));
      setShowAddModal(true);
    }
  };

  const extractionTaskAction = {
    label: "Tinjau Data Lowongan",
    onClick: reviewExtractedJob,
  };

  const createJob = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildCreatePayload(addForm);

    // Tutup modal segera agar non-blocking
    setShowAddModal(false);
    setAddForm(DEFAULT_JOB_FORM);

    runTask({
      type: "create_job",
      title: `Menyimpan: ${payload.title}`,
      description: `${payload.company} • Menjalankan deduplikasi & embedding vektor...`,
      promise: async () => {
        const res = await postJson("/api/jobs", payload);
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Gagal menyimpan lowongan");
        refetch();
        return data;
      },
      action: {
        label: "Buka Job Explorer",
        url: "/jobs",
      },
    });
  };

  const extractFromUrl = (targetUrl: string) => {
    setIsExtractingUrl(true);
    setShowUrlModal(false);

    runTask({
      type: "url_import",
      title: "Mengekstrak Lowongan dari Tautan",
      description: `${targetUrl.slice(0, 50)}...`,
      promise: async () => {
        try {
          const res = await postJson("/api/admin/jobs/import-link", { url: targetUrl });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error || "Gagal mengekstrak tautan lowongan.");
          return data.job;
        } finally {
          setIsExtractingUrl(false);
        }
      },
      onSuccess: reviewExtractedJob,
      action: extractionTaskAction,
    });
  };

  const extractFromOcr = (targetFile: File) => {
    setIsExtractingOcr(true);
    setShowOcrModal(false);

    runTask({
      type: "ocr_import",
      title: `OCR Poster: ${targetFile.name}`,
      description: "Membaca teks flyer via Multi-Tier OCR (Gemini Vision → Groq → LlamaParse)...",
      promise: async () => {
        try {
          const formData = new FormData();
          formData.append("file", targetFile);

          const res = await fetch("/api/admin/jobs/import-ocr", { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error || "Gagal melakukan OCR pada poster.");
          return data.job;
        } finally {
          setIsExtractingOcr(false);
        }
      },
      onSuccess: reviewExtractedJob,
      action: extractionTaskAction,
    });
  };

  const openEdit = (job: AdminJob) => {
    setEditId(job.id);
    setEditForm(formFromAdminJob(job));
    setShowEditModal(true);
  };

  const updateJob = (e: React.FormEvent) => {
    e.preventDefault();
    return runSubmit(async () => {
      const res = await postJson("/api/jobs", buildUpdatePayload(editId, editForm), "PUT");
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Gagal memperbarui");
      setShowEditModal(false);
      return data.message;
    });
  };

  const deleteJob = async (job: AdminJob) => {
    if (!await confirmAction(`Hapus lowongan "${job.title}" di ${job.company}?`)) {
      return;
    }
    await runSubmit(async () => {
      const res = await fetch(`/api/jobs?id=${job.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Gagal menghapus");
      return data.message || `Lowongan '${job.title}' berhasil dihapus.`;
    });
  };

  const duplicateJob = (job: AdminJob) =>
    runSubmit(async () => {
      const res = await postJson("/api/jobs", buildDuplicatePayload(job));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return `Lowongan '${job.title}' berhasil diduplikasi secara utuh ke database.`;
    });

  const triggerWorker = (sourceName: string) => {
    runTask({
      type: "worker_sync",
      title: `Sinkronisasi Worker: ${sourceName}`,
      description: `Menjalankan ingestion pipeline untuk sumber ${sourceName}...`,
      promise: async () => {
        const res = await postJson("/api/admin/worker-runs", { sourceName });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi");
        refetch();
        return data;
      },
    });
  };

  const importCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      notify({ type: "error", message: "File CSV kosong atau tidak memiliki data baris." });
      return;
    }

    setIsSubmitting(true);
    let importedCount = 0;
    let failedCount = 0;

    try {
      for (const line of lines.slice(1)) {
        const payload = buildPayloadFromCsvRow(line);
        if (!payload) continue;
        const res = await postJson("/api/jobs", payload);
        if (res.ok) importedCount++;
        else failedCount++;
      }

      if (importedCount > 0) {
        notify({
          type: "success",
          message: `Berhasil mengimpor ${importedCount} lowongan dari CSV.${failedCount > 0 ? ` (${failedCount} baris dilewati karena format/duplikasi).` : ""}`,
        });
      } else {
        notify({
          type: "error",
          message: `Tidak ada lowongan yang berhasil diimpor (${failedCount} baris gagal divalidasi).`,
        });
      }
      refetch();
    } catch {
      notify({ type: "error", message: "Terjadi kesalahan saat memproses baris CSV." });
    } finally {
      setIsSubmitting(false);
      e.target.value = "";
    }
  };

  return {
    isSubmitting,
    add: { show: showAddModal, setShow: setShowAddModal, form: addForm, setForm: setAddForm, submit: createJob },
    edit: { show: showEditModal, setShow: setShowEditModal, form: editForm, setForm: setEditForm, submit: updateJob, open: openEdit },
    url: { show: showUrlModal, setShow: setShowUrlModal, isExtracting: isExtractingUrl, submit: extractFromUrl },
    ocr: { show: showOcrModal, setShow: setShowOcrModal, isExtracting: isExtractingOcr, submit: extractFromOcr },
    deleteJob,
    duplicateJob,
    triggerWorker,
    importCsv,
  };
}
