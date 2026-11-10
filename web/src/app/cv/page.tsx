"use client";

import { confirmAction } from "@/lib/dialogs";

import React, { useState, useEffect, useRef } from "react";
import { CareerContextBar } from "@/components/career-context-bar";
import { useCareer } from "@/context/career-context";
import { experienceParts, experienceInYears } from "@/lib/experience";
import Link from "next/link";
import {
  Plus,
  X,
  UserRound,
  Eraser,
  Trash2,
  ArrowRight,
  Check,
  AlertCircle,
  GraduationCap,
  Briefcase,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AlertBanner } from "@/components/ui/error";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Spinner } from "@/components/ui/loading";
import { useAuth } from "@/lib/supabase/auth-context";
import { useAsyncTask } from "@/context/async-task-context";
import { cn } from "@/lib/utils";
import { fetchDeduped, clearDedupedCache } from "@/lib/fetcher";
import { formatGpa, parseGpaValue } from "@/lib/gpa";

interface SkillDetail { name: string; evidence: string | null; needsReview: boolean; claimed?: boolean }

interface ExtractedResumeState {
  id?: string;
  experienceTargetRole?: string | null;
  candidateName: string;
  filename: string;
  fileUrl: string | null;
  r2Key: string | null;
  education: string;
  /** IPK sebagai teks input (cth. "3,75"); kosong jika tidak dicantumkan. */
  gpa: string;
  experienceYears: number | null;
  summary: string;
  skills: string[];
}

const EMPTY_RESUME: ExtractedResumeState = {
  candidateName: "",
  filename: "Belum ada CV",
  fileUrl: null,
  r2Key: null,
  education: "",
  gpa: "",
  experienceYears: null,
  summary: "",
  skills: [],
};

export default function CVPage() {
  const { user } = useAuth();
  const career = useCareer();
  const targetRole = career.targetRole || user?.targetRole || "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persetujuan aktif (opt-in explicit, default false)
  const [consentGiven, setConsentGiven] = useState(false);
  const [currentResume, setCurrentResume] = useState<ExtractedResumeState>(EMPTY_RESUME);
  const [skills, setSkills] = useState<string[]>([]);
  const [manualSkills, setManualSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [skillDetails, setSkillDetails] = useState<SkillDetail[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const saveLock = useRef(false);
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
            id?: string;
            manualSkills?: string[];
            skillDetails?: SkillDetail[];
            experienceTargetRole?: string | null;
            filename?: string;
            fileUrl?: string;
            education?: string;
            gpa?: number | null;
            experienceYears?: number | null;
            summary?: string;
            skills?: string[];
          };
        }>("/api/cv/save");

        if (isMounted && data.resume) {
          setCurrentResume({
            id: data.resume.id,
            experienceTargetRole: data.resume.experienceTargetRole,
            candidateName: data.resume.filename?.replace(/\.[^/.]+$/, "").replace(/_/g, " ") || "Profil Pengguna",
            filename: data.resume.filename || "CV_Aktif.pdf",
            fileUrl: data.resume.fileUrl || null,
            r2Key: null,
            education: data.resume.education || "Sarjana (S1)",
            gpa: data.resume.gpa != null ? formatGpa(data.resume.gpa) : "",
            experienceYears: data.resume.experienceYears ?? null,
            summary: data.resume.summary || "",
            skills: data.resume.skills || [],
          });
          setSkills(data.resume.skills || []);
          setManualSkills(data.resume.manualSkills || []);
          setSkillDetails(data.resume.skillDetails || []);
        }
      } catch (e) {
        if (isMounted) setNotification({ type: "error", message: (e as Error).message });
      }
    };
    loadSavedCV();
    return () => {
      isMounted = false;
    };
  }, []);

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
            gpa: typeof data.gpa === "number" ? formatGpa(data.gpa) : "",
            experienceYears: data.experienceYears,
            summary: data.summary,
            skills: data.skills,
          };

          setCurrentResume(uploadedState);
          setSkills(data.skills);
          setManualSkills([]);
          setSkillDetails(data.skillDetails || []);
          setHasUnsavedDraft(true);
          setNotification({
            type: "info",
            message: `Berkas '${data.filename}' berhasil diproses. Tinjau dan koreksi keahlian di bawah, lalu klik 'Simpan CV & analisis'.`,
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
      setSkillDetails((prev) => [...prev, { name: trimmed, evidence: null, needsReview: false, claimed: true }]);
      setNewSkillInput("");
      setHasUnsavedDraft(true);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
    setManualSkills((prev) => prev.filter((s) => s !== skillToRemove));
    setSkillDetails((prev) => prev.filter((s) => s.name !== skillToRemove));
    setHasUnsavedDraft(true);
  };

  const handleSaveAndMatch = async () => {
    const payload = {
      resumeId: currentResume.id || null,
      experienceTargetRole: currentResume.experienceTargetRole || null,
      skillDetails: skillDetails.map(detail => ({ ...detail, needsReview: false })),
      targetRole,
      filename: currentResume.filename,
      fileUrl: currentResume.fileUrl,
      r2Key: currentResume.r2Key,
      education: currentResume.education,
      gpa: parseGpaValue(currentResume.gpa),
      experienceYears: currentResume.experienceYears,
      summary: currentResume.summary,
      skills,
      manualSkills,
    };

    if (saveLock.current) return;
    saveLock.current = true;
    runTask({
      type: "cv_save_match",
      title: "Sinkronisasi CV & Pencocokan Lowongan",
      description: `Menyimpan ${skills.length} keahlian & menghitung skor kecocokan lowongan...`,
      promise: async () => {
        setIsSaving(true);
        try {
          clearDedupedCache();
          const data = await fetchDeduped<{ resumeId: string; error?: string; message?: string }>("/api/cv/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          setCurrentResume((prev) => ({ ...prev, id: data.resumeId }));
          setSkillDetails(previous => previous.map(detail => ({ ...detail, needsReview: false })));
          setHasUnsavedDraft(false);
          await career.refresh();
          setNotification({
            type: "success",
            message: `Berhasil disubmit! ${data.message} Profil siap digunakan untuk analisis lowongan.`,
          });
          return data;
        } finally {
          saveLock.current = false;
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
    if (!currentResume.id) return;
    if (!await confirmAction("Hapus CV secara permanen?", { text: "Dokumen CV, hasil ekstraksi, dan hasil kecocokannya akan dihapus." })) {
      return;
    }

    setIsLoading(true);
    try {
      clearDedupedCache();
      const data = await fetchDeduped<{ success?: boolean }>("/api/cv/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: currentResume.id,
        }),
      });

      if (data.success) {
        setSkills([]);
        setManualSkills([]); setSkillDetails([]);
        await career.refresh();
        setCurrentResume({
          candidateName: "Dokumen Telah Dihapus",
          filename: "-",
          fileUrl: null,
          r2Key: null,
          education: "-",
          gpa: "",
          experienceYears: null,
          summary: "Seluruh data CV telah dibersihkan secara permanen dari server dan basis data.",
          skills: [],
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
        {/* Dark Hero Banner */}
        <div className="page-banner rounded-3xl p-6 sm:p-8 text-sb-navy relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-sb-navy">
                CV & Profil Keahlian
              </h1>
              <p className="text-sb-text-2 text-sm leading-relaxed">
                Unggah berkas CV untuk mengekstrak dan meninjau keterampilan kerjamu sebelum dianalisis kecocokannya.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3.5 py-2 rounded-2xl bg-white/70 border border-sb-border text-xs text-sb-navy">
                <span className="text-sb-text-2">Status CV: </span>
                <strong className="text-sb-blue font-semibold">{currentResume.filename}</strong>
              </div>
              <Link href="/jobs">
                <Button variant="secondary" size="sm" className="">
                  Lihat Lowongan
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {notification && (
          <AlertBanner
            type={notification.type}
            title={notification.type === "success" ? "Berhasil" : notification.type === "error" ? "Peringatan" : "Informasi"}
            message={notification.message}
          />
        )}

        <CareerContextBar beforeChange={async () => !hasUnsavedDraft || await confirmAction("Tinggalkan perubahan CV yang belum disimpan?", { destructive: false, confirmText: "Ya, lanjutkan" })} />

        {/* Section 1: Unggah CV & Persetujuan Privasi */}
        <Card id="upload">
          <CardHeader>
            <CardTitle>1. Unggah Dokumen CV Baru (PDF / DOCX)</CardTitle>
            <CardDescription>
              Dokumen disimpan secara aman dan privat di cloud storage. Ukuran maksimal 4 MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Consent Checkbox */}
            <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-sb-mist-soft border border-sb-border text-xs text-sb-navy cursor-pointer hover:bg-sb-mist-soft/80 transition-colors">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 rounded border-sb-border text-sb-blue focus:ring-sb-blue"
              />
              <span>
                <strong>Persetujuan Privasi:</strong> Saya menyetujui dokumen CV ini diproses secara aman untuk ekstraksi keterampilan kerja dan pencocokan lowongan. Dokumen dapat dihapus permanen kapan saja.
              </span>
            </label>

            <div className="border-2 border-dashed border-sb-border hover:border-sb-blue rounded-2xl p-6 sm:p-8 text-center transition-colors bg-white/40">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileUpload}
                className="sr-only"
                id="cv-file-upload"
                disabled={isLoading || !consentGiven}
              />
              <label
                htmlFor="cv-file-upload"
                className={`flex flex-col items-center justify-center cursor-pointer ${
                  !consentGiven ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-sb-mist-soft text-sb-blue flex items-center justify-center mb-2.5 shadow-2xs border border-sb-border">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-sb-navy">
                  {isLoading ? "Sedang Mengunggah & Memproses Dokumen..." : "Klik untuk Memilih Dokumen CV"}
                </span>
                <span className="text-xs text-sb-text-2 mt-1">
                  Format yang didukung: .PDF, .DOCX (Maksimal 4 MB)
                </span>
              </label>
              <Button type="button" variant="outline" size="sm" disabled={isLoading || !consentGiven} onClick={() => fileInputRef.current?.click()} className="mt-3">Pilih berkas CV</Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Role Target & Ringkasan Profil */}
        <div className="grid grid-cols-1 gap-6">
          {/* Target karier tampil & diubah di bar CV/target di atas (tidak diulang di sini) */}
          <Card>
            <CardHeader>
              <CardTitle>Profil Hasil Ekstraksi (Pendidikan & Pengalaman)</CardTitle>
              <CardDescription>
                File: <strong className="text-sb-navy">{currentResume.filename}</strong> — Kamu dapat mengoreksi kualifikasi sebelum disimpan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Editor Pendidikan */}
                <div className="p-3.5 rounded-xl border border-sb-border bg-white/70 shadow-2xs space-y-1.5">
                  <label htmlFor="cv-education" className="flex items-center gap-1.5 text-xs font-bold text-sb-navy">
                    <GraduationCap className="w-4 h-4 text-sb-blue" />
                    Pendidikan Terakhir
                  </label>
                  <input
                    id="cv-education"
                    type="text"
                    value={currentResume.education}
                    onChange={(e) => {
                      setCurrentResume((prev) => ({ ...prev, education: e.target.value }));
                      setHasUnsavedDraft(true);
                    }}
                    placeholder="cth. S1 Sains Data / Sarjana Komputer"
                    className="w-full text-xs font-semibold px-3 py-1.5 rounded-lg border border-sb-border focus:outline-none focus:ring-1 focus:ring-sb-blue bg-white text-sb-navy"
                  />
                  <span className="text-xs text-sb-text-2 block">Koreksi jenjang pendidikan formalmu.</span>
                </div>

                {/* Editor IPK */}
                <div className="p-3.5 rounded-xl border border-sb-border bg-white/70 shadow-2xs space-y-1.5">
                  <label htmlFor="cv-gpa" className="flex items-center gap-1.5 text-xs font-bold text-sb-navy">
                    <GraduationCap className="w-4 h-4 text-sb-blue" />
                    IPK (skala 4,00)
                  </label>
                  <input
                    id="cv-gpa"
                    type="text"
                    inputMode="decimal"
                    value={currentResume.gpa}
                    onChange={(e) => {
                      setCurrentResume((prev) => ({ ...prev, gpa: e.target.value }));
                      setHasUnsavedDraft(true);
                    }}
                    placeholder="cth. 3,75"
                    aria-invalid={currentResume.gpa !== "" && parseGpaValue(currentResume.gpa) === null}
                    className="w-full text-xs font-semibold px-3 py-1.5 rounded-lg border border-sb-border focus:outline-none focus:ring-1 focus:ring-sb-blue bg-white text-sb-navy"
                  />
                  <span
                    className={cn(
                      "text-xs block",
                      currentResume.gpa !== "" && parseGpaValue(currentResume.gpa) === null ? "text-sb-risk" : "text-sb-text-2"
                    )}
                  >
                    {currentResume.gpa !== "" && parseGpaValue(currentResume.gpa) === null
                      ? "Isi angka antara 1,00 dan 4,00, atau kosongkan."
                      : "Dipakai untuk lowongan yang mensyaratkan IPK. Boleh dikosongkan."}
                  </span>
                </div>

                {/* Editor Pengalaman Kerja */}
                <div className="p-3.5 rounded-xl border border-sb-border bg-white/70 shadow-2xs space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-sb-navy">
                    <Briefcase className="w-4 h-4 text-sb-good" />
                    Pengalaman Kerja Relevan
                  </label>
                  <div className="flex items-center gap-2">
                    {(["years", "months"] as const).map((part) => <label key={part} className="text-xs min-w-0">{part === "years" ? "Tahun" : "Bulan"}
                      <input type="number" min={0} max={part === "years" ? 80 : 11} step={1} value={experienceParts(currentResume.experienceYears)[part]}
                        onChange={(e) => {
                          const parts = experienceParts(currentResume.experienceYears);
                          try {
                            const years = experienceInYears(part === "years" ? e.target.value : parts.years, part === "months" ? e.target.value : parts.months);
                            setCurrentResume((prev) => ({ ...prev, experienceYears: years, experienceTargetRole: targetRole }));
                            setHasUnsavedDraft(true);
                          } catch (err) { setNotification({ type: "error", message: (err as Error).message }); }
                        }} className="block w-full max-w-28 px-3 py-2 rounded-lg border border-sb-border bg-white" />
                    </label>)}
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs text-sb-text-2">{currentResume.experienceTargetRole ? `Untuk ${currentResume.experienceTargetRole}` : "Relevansi belum dipilih"}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {targetRole && currentResume.experienceTargetRole !== targetRole && <button type="button" title={`Gunakan pengalaman ini untuk ${targetRole}`} aria-label={`Gunakan pengalaman ini untuk ${targetRole}`} className="p-2 rounded-lg text-sb-blue hover:bg-sb-mist-soft focus-visible:outline-2 focus-visible:outline-sb-blue" onClick={() => { setCurrentResume(prev => ({ ...prev, experienceTargetRole: targetRole })); setHasUnsavedDraft(true); }}><Check className="w-4 h-4"/></button>}
                      <button type="button" title="Kosongkan pengalaman" aria-label="Kosongkan pengalaman" disabled={currentResume.experienceYears === null} className="p-2 rounded-lg text-sb-text-2 hover:bg-sb-mist-soft disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-sb-blue" onClick={() => { setCurrentResume(prev => ({ ...prev, experienceYears: null, experienceTargetRole: targetRole })); setHasUnsavedDraft(true); }}><Eraser className="w-4 h-4"/></button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="cv-summary" className="text-[11px] font-semibold text-sb-text-2">Ringkasan Profil Dokumen:</label>
                <input
                  type="text"
                  id="cv-summary"
                  value={currentResume.summary}
                  onChange={(e) => {
                    setCurrentResume((prev) => ({ ...prev, summary: e.target.value }));
                    setHasUnsavedDraft(true);
                  }}
                  className="w-full text-xs text-sb-navy px-3 py-1.5 rounded-lg border border-sb-border focus:outline-none focus:ring-1 focus:ring-sb-blue bg-white"
                  placeholder="Ringkasan kualifikasi singkat..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Koreksi Skill Pengguna */}
        <Card id="review-skills">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <span>2. Tinjau & Koreksi Daftar Skill</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sb-mist-soft text-sb-blue border border-sb-border font-mono-metric">
                  {skills.length} Skill Terdaftar
                </span>
                {hasUnsavedDraft ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sb-warning/15 text-sb-warning border border-sb-warning/30">
                    Belum disimpan
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sb-good/10 text-sb-good border border-sb-good/30">
                    {currentResume.id ? "Tersimpan" : "Belum ada CV tersimpan"}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Tambahkan atau hapus skill sesuai keahlianmu.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!currentResume.id || isLoading || isSaving}
              onClick={handleDeleteResume}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              className="text-xs text-sb-critical hover:bg-sb-critical/10 hover:border-sb-critical/30"
            >
              Hapus CV Permanen
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-xs text-sb-text-2">Koreksi daftar skill, lalu simpan untuk digunakan dalam analisis. Ikon pengguna menandai skill yang ditambahkan sendiri.</p>
            <div className="flex flex-wrap gap-2">
              {skills.length === 0 && <p className="text-sm text-sb-text-2">Belum ada skill. Tambahkan di bawah.</p>}
              {skills.map(name => <span key={name} className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-sb-mist-soft border border-sb-border text-sm font-semibold text-sb-navy">
                {manualSkills.includes(name) && <UserRound className="w-3.5 h-3.5 text-sb-blue" aria-label="Ditambahkan sendiri"><title>Ditambahkan sendiri</title></UserRound>}
                {name}
                <button type="button" onClick={() => handleRemoveSkill(name)} aria-label={`Hapus ${name}`} title={`Hapus ${name}`} className="p-1.5 rounded-full text-sb-text-2 hover:bg-white hover:text-sb-critical focus-visible:outline-2 focus-visible:outline-sb-blue"><X className="w-3.5 h-3.5"/></button>
              </span>)}
            </div>
            {skills.length > 0 && <details className="text-xs text-sb-text-2"><summary className="cursor-pointer text-sb-blue font-semibold">Lihat asal skill</summary><ul className="mt-3 space-y-3">{skills.map(name => {
              const detail = skillDetails.find(skill => skill.name === name);
              const manual = manualSkills.includes(name);
              return <li key={name} className="rounded-lg border border-sb-border p-3 bg-white/60"><div className="flex items-center justify-between gap-2"><strong className="text-sb-navy">{name}</strong><span>{manual ? "Ditambahkan sendiri" : "Hasil CV"}</span></div>{!manual && detail?.evidence && <p className="mt-1 line-clamp-2" title={detail.evidence}>{detail.evidence}</p>}{!manual && <button type="button" className="mt-2 inline-flex items-center gap-1 text-sb-blue underline" onClick={() => { setManualSkills(previous => [...previous, name]); setSkillDetails(previous => previous.map(skill => skill.name === name ? { ...skill, needsReview: false, claimed: true } : skill)); setHasUnsavedDraft(true); }}><UserRound className="w-3.5 h-3.5"/>Tandai ditambahkan sendiri</button>}</li>;
            })}</ul></details>}

            {/* Add Skill Input */}
            <div className="flex items-end gap-2 max-w-lg">
              <div className="flex-1 min-w-0">
                <TextInput
                  label="Tambah skill"
                  placeholder="cth. SQL, Python, Tableau"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleAddSkill}
                disabled={!newSkillInput.trim()}
                className="h-10 shrink-0"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Tambah
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/50 rounded-b-2xl border-t border-sb-border">
            <span className="text-xs text-sb-text-2 flex items-center gap-1.5">
              {hasUnsavedDraft ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-sb-warning shrink-0" />
                  <span>Simpan untuk menggunakan perubahan ini.</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-sb-good shrink-0" />
                  <span>{currentResume.id ? "Profil CV tersimpan." : "Unggah CV atau isi profil sebelum menyimpan."}</span>
                </>
              )}
            </span>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Button
                variant={hasUnsavedDraft ? "primary" : "outline"}
                size="md"
                className="w-full sm:w-auto"
                onClick={handleSaveAndMatch}
                disabled={isSaving || isLoading || skills.length === 0 || !targetRole}
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Menyimpan & Menghitung Kecocokan...
                  </>
                ) : (
                  <>
                    Simpan CV & analisis
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

