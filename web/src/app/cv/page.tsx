"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ArrowRight,
  FileCheck,
  Check,
  AlertCircle,
  GraduationCap,
  Briefcase,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInput, Select } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AlertBanner } from "@/components/ui/error";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Spinner } from "@/components/ui/loading";
import { useAuth } from "@/lib/supabase/auth-context";
import { useAsyncTask } from "@/context/async-task-context";
import { cn } from "@/lib/utils";
import { fetchDeduped, clearDedupedCache } from "@/lib/fetcher";

interface ExtractedResumeState {
  candidateName: string;
  filename: string;
  fileUrl: string | null;
  r2Key: string | null;
  education: string;
  experienceYears: number;
  summary: string;
  skills: string[];
  isPreset: boolean;
}

const DEFAULT_MATCH_CV: ExtractedResumeState = {
  candidateName: "Budi Pratama (Kandidat Match)",
  filename: "CV_Budi_Pratama_DataAnalyst.pdf",
  fileUrl: "https://r2.skillbridge.id/resumes/demo/budi_pratama.pdf",
  r2Key: "demo/CV_Budi_Pratama_DataAnalyst.pdf",
  education: "S1 Matematika & Statistika",
  experienceYears: 2,
  summary:
    "Data Analyst dengan 2 tahun pengalaman industri fintech. Mahir SQL, Python Pandas, visualisasi data Tableau & Power BI, serta pemodelan statistik.",
  skills: ["SQL", "Python", "Tableau", "Power BI", "Excel", "Statistics", "A/B Testing", "Data Modeling"],
  isPreset: true,
};

const DEFAULT_UNDERQUALIFIED_CV: ExtractedResumeState = {
  candidateName: "Rina Kusuma (Kandidat Underqualified)",
  filename: "CV_Rina_Kusuma_Junior.pdf",
  fileUrl: "https://r2.skillbridge.id/resumes/demo/rina_kusuma.pdf",
  r2Key: "demo/CV_Rina_Kusuma_Junior.pdf",
  education: "D3 Administrasi Perkantoran",
  experienceYears: 0,
  summary:
    "Lulusan administrasi perkantoran dengan keahlian pengoperasian spreadsheet dasar dan entri data. Tertarik beralih karir ke bidang data.",
  skills: ["Excel", "Canva", "Google Docs", "Data Entry"],
  isPreset: true,
};

export default function CVPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persetujuan aktif (opt-in explicit, default false)
  const [consentGiven, setConsentGiven] = useState(false);
  const [currentResume, setCurrentResume] = useState<ExtractedResumeState>(DEFAULT_MATCH_CV);
  const [skills, setSkills] = useState<string[]>(DEFAULT_MATCH_CV.skills);
  const [manualSkills, setManualSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [targetRole, setTargetRole] = useState("Data Analyst");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);
  const { runTask } = useAsyncTask();
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Muat resume aktif yang tersimpan di database jika ada
  useEffect(() => {
    let isMounted = true;
    const loadSavedCV = async () => {
      try {
        const data = await fetchDeduped<{
          resume?: {
            filename?: string;
            fileUrl?: string;
            education?: string;
            experienceYears?: number;
            summary?: string;
            skills?: string[];
          };
        }>("/api/cv/save");

        if (isMounted && data.resume && data.resume.skills && data.resume.skills.length > 0) {
          setCurrentResume({
            candidateName: data.resume.filename?.replace(/\.[^/.]+$/, "").replace(/_/g, " ") || "Profil Pengguna",
            filename: data.resume.filename || "CV_Aktif.pdf",
            fileUrl: data.resume.fileUrl || null,
            r2Key: null,
            education: data.resume.education || "Sarjana (S1)",
            experienceYears: data.resume.experienceYears || 0,
            summary: data.resume.summary || "",
            skills: data.resume.skills || [],
            isPreset: false,
          });
          setSkills(data.resume.skills || []);
        }
      } catch {
        // Fallback default
      }
    };
    loadSavedCV();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePresetSelect = async (preset: "match" | "underqualified") => {
    setIsLoading(true);
    setNotification(null);
    try {
      const fd = new FormData();
      fd.append("preset", preset);
      const res = await fetch("/api/cv/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (data.success) {
        const nextState: ExtractedResumeState = {
          candidateName: data.candidateName,
          filename: data.filename,
          fileUrl: data.fileUrl,
          r2Key: data.r2Key,
          education: data.education,
          experienceYears: data.experienceYears,
          summary: data.summary,
          skills: data.skills,
          isPreset: true,
        };
        setCurrentResume(nextState);
        setSkills(data.skills);
        setHasUnsavedDraft(true);
        setNotification({
          type: "info",
          message: `CV Contoh '${data.candidateName}' (${preset === "match" ? "Kandidat Cocok" : "Kandidat Kurang Cocok"}) berhasil dimuat. Klik 'Simpan CV & Hitung Kecocokan' untuk menghitung skor kecocokan.`,
        });
      }
    } catch {
      const fallback = preset === "match" ? DEFAULT_MATCH_CV : DEFAULT_UNDERQUALIFIED_CV;
      setCurrentResume(fallback);
      setSkills(fallback.skills);
      setHasUnsavedDraft(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!consentGiven) {
      setNotification({
        type: "error",
        message: "Harap setujui persetujuan pemrosesan data CV terlebih dahulu.",
      });
      return;
    }

    const targetFile = file;
    if (fileInputRef.current) fileInputRef.current.value = "";

    runTask({
      type: "cv_upload",
      title: `Memproses CV: ${targetFile.name}`,
      description: "Mengunggah berkas CV & mengekstrak keterampilan kerja...",
      promise: async () => {
        setIsLoading(true);
        try {
          const fd = new FormData();
          fd.append("file", targetFile);
          const res = await fetch("/api/cv/upload", { method: "POST", body: fd });
          const data = await res.json();

          if (!res.ok || data.error) {
            throw new Error(data.error || "Gagal mengunggah berkas");
          }

          const uploadedState: ExtractedResumeState = {
            candidateName: data.candidateName,
            filename: data.filename,
            fileUrl: data.fileUrl,
            r2Key: data.r2Key,
            education: data.education,
            experienceYears: data.experienceYears,
            summary: data.summary,
            skills: data.skills,
            isPreset: false,
          };

          setCurrentResume(uploadedState);
          setSkills(data.skills);
          setHasUnsavedDraft(true);
          setNotification({
            type: "info",
            message: `Berkas '${data.filename}' berhasil diproses. Tinjau dan koreksi keahlian di bawah, lalu klik 'Simpan CV & Hitung Kecocokan'.`,
          });

          return uploadedState;
        } finally {
          setIsLoading(false);
        }
      },
      action: {
        label: "Tinjau Skill Ekstraksi",
        url: "/cv",
      },
    });
  };

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      setSkills([...skills, trimmed]);
      setManualSkills((prev) => [...prev, trimmed]);
      setNewSkillInput("");
      setHasUnsavedDraft(true);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
    setManualSkills((prev) => prev.filter((s) => s !== skillToRemove));
    setHasUnsavedDraft(true);
  };

  const handleSaveAndMatch = async () => {
    const payload = {
      userId: user?.id,
      targetRole,
      filename: currentResume.filename,
      fileUrl: currentResume.fileUrl,
      r2Key: currentResume.r2Key,
      education: currentResume.education,
      experienceYears: currentResume.experienceYears,
      summary: currentResume.summary,
      skills,
      manualSkills,
    };

    runTask({
      type: "cv_save_match",
      title: "Sinkronisasi CV & Pencocokan Lowongan",
      description: `Menyimpan ${skills.length} keahlian & menghitung skor kecocokan 42 lowongan...`,
      promise: async () => {
        setIsSaving(true);
        try {
          clearDedupedCache();
          const data = await fetchDeduped<{ error?: string; message?: string }>("/api/cv/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          setHasUnsavedDraft(false);
          setNotification({
            type: "success",
            message: `Berhasil disubmit! ${data.message} Seluruh transaksi basis data dan kalkulasi kecocokan 42 lowongan selesai diproses.`,
          });
          return data;
        } finally {
          setIsSaving(false);
        }
      },
      action: {
        label: "Buka Job Explorer",
        url: "/jobs",
      },
    });
  };

  const handleDeleteResume = async () => {
    if (!confirm("Apakah kamu yakin ingin menghapus dokumen CV, hasil ekstraksi, dan seluruh kalkulasi match secara permanen?")) {
      return;
    }

    setIsLoading(true);
    try {
      clearDedupedCache();
      const data = await fetchDeduped<{ success?: boolean }>("/api/cv/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          r2Key: currentResume.r2Key,
        }),
      });

      if (data.success) {
        setSkills([]);
        setCurrentResume({
          candidateName: "Dokumen Telah Dihapus",
          filename: "-",
          fileUrl: null,
          r2Key: null,
          education: "-",
          experienceYears: 0,
          summary: "Seluruh data CV telah dibersihkan secara permanen dari server dan basis data.",
          skills: [],
          isPreset: false,
        });
        setNotification({
          type: "info",
          message: "Data CV dan seluruh hasil ekstraksi telah berhasil dihapus secara permanen.",
        });
      }
    } catch {
      setNotification({
        type: "error",
        message: "Gagal menghapus data CV.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            CV Saya
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Unggah berkas CV-mu atau pilih profil contoh untuk membandingkan kecocokan dengan lowongan target.
          </p>
        </div>

        {notification && (
          <AlertBanner
            type={notification.type}
            title={notification.type === "success" ? "Berhasil" : notification.type === "error" ? "Peringatan" : "Informasi"}
            message={notification.message}
          />
        )}

        {/* Skenario Contoh CV */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <FileCheck className="w-4 h-4 text-blue-600" />
            Pilihan Profil Contoh untuk Perbandingan:
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              variant={currentResume.candidateName.includes("Budi") ? "primary" : "outline"}
              onClick={() => handlePresetSelect("match")}
              disabled={isLoading || isSaving}
            >
              Kasus 1: Kandidat Match (Budi Pratama — SQL, Python, Tableau)
            </Button>
            <Button
              size="sm"
              variant={currentResume.candidateName.includes("Rina") ? "primary" : "outline"}
              onClick={() => handlePresetSelect("underqualified")}
              disabled={isLoading || isSaving}
            >
              Kasus 2: Kandidat Underqualified (Rina — Fresh Graduate Excel Dasar)
            </Button>
          </div>
        </div>

        {/* Section 1: Unggah CV & Persetujuan Privasi */}
        <Card>
          <CardHeader>
            <CardTitle>1. Unggah Dokumen CV Baru (PDF / DOCX)</CardTitle>
            <CardDescription>
              Dokumen disimpan secara aman dan privat. Ukuran maksimal 5 MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Consent Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <strong>Persetujuan Privasi:</strong> Saya menyetujui dokumen CV ini diproses secara aman untuk ekstraksi keterampilan kerja dan pencocokan lowongan. Dokumen dapat dihapus permanen kapan saja.
              </span>
            </label>

            <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 text-center transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileUpload}
                className="hidden"
                id="cv-file-upload"
                disabled={isLoading || !consentGiven}
              />
              <label
                htmlFor="cv-file-upload"
                className={`flex flex-col items-center justify-center cursor-pointer ${
                  !consentGiven ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {isLoading ? "Sedang Mengunggah & Memproses Dokumen..." : "Klik untuk Memilih Dokumen CV"}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Format yang didukung: .PDF, .DOCX (Maksimal 5 MB)
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Role Target & Ringkasan Profil */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Role Target</CardTitle>
              <CardDescription>Menentukan acuan perhitungan gap</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                label="Role Pekerjaan"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                options={[
                  { label: "Data Analyst", value: "Data Analyst" },
                  { label: "Business Intelligence (BI) Analyst", value: "BI Analyst" },
                  { label: "Software Engineer", value: "Software Engineer" },
                  { label: "Frontend Developer", value: "Frontend Developer" },
                  { label: "Backend Developer", value: "Backend Developer" },
                  { label: "Product Manager", value: "Product Manager" },
                  { label: "UI/UX Designer", value: "UI/UX Designer" },
                  { label: "Digital Marketing Specialist", value: "Digital Marketing Specialist" },
                  { label: "Financial Analyst", value: "Financial Analyst" },
                  { label: "Operations Specialist", value: "Operations Specialist" },
                  { label: "Cybersecurity Analyst", value: "Cybersecurity Analyst" },
                  { label: "Lainnya (Umum)", value: "General" },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Profil Hasil Ekstraksi (Pendidikan & Pengalaman)</CardTitle>
              <CardDescription>
                File: <strong className="text-slate-800">{currentResume.filename}</strong> — Kamu dapat mengoreksi kualifikasi sebelum disimpan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Editor Pendidikan */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    Pendidikan Terakhir
                  </label>
                  <input
                    type="text"
                    value={currentResume.education}
                    onChange={(e) => {
                      setCurrentResume((prev) => ({ ...prev, education: e.target.value }));
                      setHasUnsavedDraft(true);
                    }}
                    placeholder="cth. S1 Sains Data / Sarjana Komputer"
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                  />
                  <span className="text-[10px] text-slate-400 block">Koreksi jenjang pendidikan formalmu.</span>
                </div>

                {/* Editor Pengalaman Kerja */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    Pengalaman Kerja Relevan
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={35}
                      value={currentResume.experienceYears}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        setCurrentResume((prev) => ({ ...prev, experienceYears: val }));
                        setHasUnsavedDraft(true);
                      }}
                      className="w-24 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                    />
                    <span className="text-xs text-slate-600 font-semibold">Tahun Relevan</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Durasi kumulatif pengalaman di role target.</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Ringkasan Profil Dokumen:</label>
                <input
                  type="text"
                  value={currentResume.summary}
                  onChange={(e) => {
                    setCurrentResume((prev) => ({ ...prev, summary: e.target.value }));
                    setHasUnsavedDraft(true);
                  }}
                  className="w-full text-xs text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                  placeholder="Ringkasan kualifikasi singkat..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Koreksi Skill Pengguna */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>3. Tinjau & Koreksi Daftar Skill</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
                  {skills.length} Skill Terdaftar
                </span>
                {hasUnsavedDraft ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Draft Baru (Belum Disubmit)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Tersimpan di Database
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Pengguna bebas mengoreksi hasil ekstraksi (menambah atau menghapus) sebelum match dihitung.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteResume}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              className="text-xs text-red-600 hover:bg-red-50 hover:border-red-200"
            >
              Hapus CV Permanen
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Skill Badges */}
            <div className="flex flex-wrap items-center gap-2 min-h-12 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              {skills.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  Belum ada skill yang ditambahkan. Gunakan kolom input di bawah untuk menambahkan.
                </span>
              ) : (
                skills.map((s) => {
                  const isManual = manualSkills.includes(s);
                  return (
                    <span
                      key={s}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-colors duration-150",
                        isManual
                          ? "border-amber-200 bg-amber-50/80 text-amber-900"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                      )}
                    >
                      <span>{s}</span>
                      {isManual && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900">
                          Klaim Mandiri
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                        title={`Hapus skill ${s}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            {/* Add Skill Input */}
            <div className="flex items-center gap-2 max-w-md">
              <TextInput
                placeholder="Tambah skill baru (cth. SQL, Python, Tableau)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
              />
              <Button variant="outline" size="md" onClick={handleAddSkill}>
                <Plus className="w-4 h-4 mr-1" />
                Tambah
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 rounded-b-xl border-t border-slate-200">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              {hasUnsavedDraft ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Draft baru: Simpan CV untuk memperbarui kalkulasi kecocokan lowongan.</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Profil dan kecocokan lowongan tersimpan.</span>
                </>
              )}
            </span>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant={hasUnsavedDraft ? "primary" : "outline"}
                size="md"
                className="w-full sm:w-auto"
                onClick={handleSaveAndMatch}
                disabled={isSaving || skills.length === 0}
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Menyimpan & Menghitung Kecocokan...
                  </>
                ) : (
                  <>
                    {hasUnsavedDraft ? "Simpan CV & Hitung Kecocokan" : "Hitung Ulang Kecocokan"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              <Link href="/jobs" className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full sm:w-auto">
                  Buka Job Explorer
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
