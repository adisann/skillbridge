"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Play,
  Copy,
  Plus,
  UploadCloud,
  Layers,
  Database,
  History,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TextInput, Select, Textarea } from "@/components/ui/input";
import { DataTable, Column } from "@/components/ui/table";
import { AlertBanner } from "@/components/ui/error";
import { SkeletonTable } from "@/components/ui/loading";
import { ProtectedRoute } from "@/components/layout/protected-route";

interface AdminJob {
  id: string;
  title: string;
  canonicalTitle: string;
  company: string;
  location: string;
  employmentType: string;
  seniority: string;
  experienceYearsMin?: number;
  education?: string;
  description?: string;
  sourceName: string;
  retrievalMethod: string;
  requiredSkills: string[];
  preferredSkills?: string[];
}

interface WorkerRunRecord {
  id: string;
  source_name: string;
  retrieval_method: string;
  status: string;
  created_at: string;
  fetched_count: number;
  inserted_count: number;
  updated_count: number;
  duplicate_count: number;
  failed_count: number;
  error_message: string | null;
}

interface SkillItem {
  id: string;
  name: string;
  category: string;
  skill_aliases: Array<{ id: string; alias: string }>;
}

interface JobSourceItem {
  id: string;
  name: string;
  base_url: string;
  is_active: boolean;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"jobs" | "skills" | "runs">("jobs");
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [runs, setRuns] = useState<WorkerRunRecord[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [sources, setSources] = useState<JobSourceItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Form Tambah Lowongan
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formLocation, setFormLocation] = useState("Jakarta, Indonesia (Hybrid)");
  const [formRole, setFormRole] = useState("Data Analyst");
  const [formSeniority, setFormSeniority] = useState("Mid");
  const [formExperience, setFormExperience] = useState("2");
  const [formEducation, setFormEducation] = useState("Bachelor");
  const [formRequiredSkills, setFormRequiredSkills] = useState("SQL, Python, Excel");
  const [formPreferredSkills, setFormPreferredSkills] = useState("Tableau, Power BI");
  const [formDescription, setFormDescription] = useState("");

  // Form Edit Lowongan
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editRole, setEditRole] = useState("Data Analyst");
  const [editSeniority, setEditSeniority] = useState("Mid");
  const [editExperience, setEditExperience] = useState("2");
  const [editEducation, setEditEducation] = useState("Bachelor");
  const [editRequiredSkills, setEditRequiredSkills] = useState("");
  const [editPreferredSkills, setEditPreferredSkills] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Form Tambah Master Skill & Alias Skill
  const [masterSkillName, setMasterSkillName] = useState("");
  const [masterSkillCategory, setMasterSkillCategory] = useState("Data & Analytics");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillAlias, setNewSkillAlias] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [jobsRes, runsRes, skillsRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/admin/worker-runs"),
        fetch("/api/admin/skills"),
      ]);

      const jobsData = await jobsRes.json();
      const runsData = await runsRes.json();
      const skillsData = await skillsRes.json();

      if (jobsData.jobs) setJobs(jobsData.jobs);
      if (runsData.runs) setRuns(runsData.runs);
      if (skillsData.skills) setSkills(skillsData.skills);
      if (skillsData.sources) setSources(skillsData.sources);
    } catch {
      setNotification({ type: "error", message: "Gagal memuat data dari database Supabase." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const runFetch = async () => {
      try {
        const [jobsRes, runsRes, skillsRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/admin/worker-runs"),
          fetch("/api/admin/skills"),
        ]);

        const jobsData = await jobsRes.json();
        const runsData = await runsRes.json();
        const skillsData = await skillsRes.json();

        if (isMounted) {
          if (jobsData.jobs) setJobs(jobsData.jobs);
          if (runsData.runs) setRuns(runsData.runs);
          if (skillsData.skills) setSkills(skillsData.skills);
          if (skillsData.sources) setSources(skillsData.sources);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setNotification({ type: "error", message: "Gagal memuat data dari database Supabase." });
          setIsLoading(false);
        }
      }
    };
    runFetch();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          company: formCompany,
          location: formLocation,
          canonicalTitle: formRole,
          seniority: formSeniority,
          experienceYearsMin: parseInt(formExperience, 10) || 1,
          education: formEducation,
          requiredSkills: formRequiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
          preferredSkills: formPreferredSkills.split(",").map((s) => s.trim()).filter(Boolean),
          description: formDescription,
          sourceUrl: "https://skillbridge.id/admin",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Gagal menyimpan");

      setNotification({ type: "success", message: data.message });
      setShowAddModal(false);
      // Reset form
      setFormTitle("");
      setFormCompany("");
      setFormDescription("");
      fetchData();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (job: AdminJob) => {
    setEditId(job.id);
    setEditTitle(job.title);
    setEditCompany(job.company);
    setEditLocation(job.location || "Jakarta, Indonesia (Hybrid)");
    setEditRole(job.canonicalTitle || "Data Analyst");
    setEditSeniority(job.seniority || "Mid");
    setEditExperience(String(job.experienceYearsMin || 2));
    setEditEducation(job.education || "Bachelor");
    setEditRequiredSkills((job.requiredSkills || []).join(", "));
    setEditPreferredSkills((job.preferredSkills || []).join(", "));
    setEditDescription(job.description || "");
    setShowEditModal(true);
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          title: editTitle,
          company: editCompany,
          location: editLocation,
          canonicalTitle: editRole,
          seniority: editSeniority,
          experienceYearsMin: parseInt(editExperience, 10) || 1,
          education: editEducation,
          requiredSkills: editRequiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
          preferredSkills: editPreferredSkills.split(",").map((s) => s.trim()).filter(Boolean),
          description: editDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Gagal memperbarui");

      setNotification({ type: "success", message: data.message });
      setShowEditModal(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (job: AdminJob) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus lowongan "${job.title}" di ${job.company} dari basis data?`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/jobs?id=${job.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Gagal menghapus");

      setNotification({ type: "success", message: data.message || `Lowongan '${job.title}' berhasil dihapus.` });
      fetchData();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicateJob = async (job: AdminJob) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${job.title} (Salinan Admin)`,
          company: job.company,
          location: job.location,
          canonicalTitle: job.canonicalTitle,
          seniority: job.seniority,
          experienceYearsMin: 2,
          education: "Bachelor",
          requiredSkills: job.requiredSkills || ["SQL", "Excel"],
          preferredSkills: ["Tableau"],
          description: `Salinan data kualifikasi dari ${job.title} di ${job.company}. Melewati pipeline deduplikasi dan embedding.`,
          sourceUrl: "https://skillbridge.id/admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotification({ type: "success", message: `Lowongan '${job.title}' berhasil diduplikasi ke database.` });
      fetchData();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerWorker = async (sourceName: string) => {
    setIsSubmitting(true);
    setNotification({ type: "info", message: `Memicu sinkronisasi worker untuk '${sourceName}'...` });
    try {
      const res = await fetch("/api/admin/worker-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotification({ type: "success", message: `Sinkronisasi '${sourceName}' berhasil dicatat di riwayat audit worker_runs.` });
      fetchData();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName || !newSkillAlias) return;

    try {
      const res = await fetch("/api/admin/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName: newSkillName, alias: newSkillAlias }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotification({ type: "success", message: `Alias '${newSkillAlias}' berhasil dipetakan ke skill master '${newSkillName}'.` });
      setNewSkillAlias("");
      fetchData();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: "error", message: error.message });
    }
  };

  const handleCreateMasterSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterSkillName) return;

    try {
      const res = await fetch("/api/admin/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName: masterSkillName, category: masterSkillCategory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotification({ type: "success", message: `Skill master '${masterSkillName}' berhasil ditambahkan ke taksonomi.` });
      setMasterSkillName("");
      fetchData();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: "error", message: error.message });
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      setNotification({ type: "error", message: "File CSV kosong atau tidak memiliki data baris." });
      return;
    }

    setIsSubmitting(true);
    let importedCount = 0;

    try {
      // Header: title,company,location,role,required_skills,description
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        if (parts.length >= 3) {
          const title = parts[0]?.trim() || "Data Analyst";
          const company = parts[1]?.trim() || "Perusahaan Mitra";
          const location = parts[2]?.trim() || "Indonesia";
          const role = parts[3]?.trim() || "Data Analyst";
          const reqSkills = (parts[4] || "SQL,Excel").split(";").map((s) => s.trim());
          const description = parts[5]?.trim() || `${title} di ${company}. Persyaratan: ${reqSkills.join(", ")}`;

          await fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              company,
              location,
              canonicalTitle: role,
              seniority: "Mid",
              experienceYearsMin: 2,
              education: "Bachelor",
              requiredSkills: reqSkills,
              preferredSkills: ["Tableau"],
              description,
              sourceUrl: "https://skillbridge.id/admin/csv",
            }),
          });
          importedCount++;
        }
      }

      setNotification({ type: "success", message: `Berhasil mengimpor ${importedCount} lowongan dari CSV melalui pipeline.` });
      fetchData();
    } catch {
      setNotification({ type: "error", message: "Terjadi kesalahan saat memproses baris CSV." });
    } finally {
      setIsSubmitting(false);
      e.target.value = "";
    }
  };

  const runColumns: Column<WorkerRunRecord>[] = [
    {
      key: "source_name",
      header: "Sumber Data",
      render: (row) => <span className="font-mono font-bold text-slate-900">{row.source_name}</span>,
    },
    {
      key: "retrieval_method",
      header: "Metode",
      render: (row) => (
        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {row.retrieval_method}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {row.status}
        </span>
      ),
    },
    {
      key: "fetched_count",
      header: "Hasil (Fetch / Insert / Duplikat)",
      render: (row) => (
        <span className="font-mono text-xs">
          {row.fetched_count} ambil / <strong className="text-emerald-600">{row.inserted_count} baru</strong> /{" "}
          <span className="text-amber-600">{row.duplicate_count} lewati</span>
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Waktu Eksekusi",
      render: (row) => (
        <span className="text-slate-500 font-mono text-xs">
          {new Date(row.created_at).toLocaleString("id-ID")}
        </span>
      ),
    },
  ];

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dashboard Admin Import & Monitoring (FR-12)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kelola katalog lowongan manual, taksonomi normalisasi skill, dan pantau log audit riwayat worker_runs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Tambah Lowongan
            </Button>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                className="hidden"
                disabled={isSubmitting}
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs">
                <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                Impor CSV
              </span>
            </label>
          </div>
        </div>

        {notification && (
          <AlertBanner
            type={notification.type}
            title={notification.type === "success" ? "Berhasil" : notification.type === "error" ? "Gagal" : "Informasi"}
            message={notification.message}
          />
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("jobs")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "jobs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Database className="w-4 h-4" />
            Katalog Lowongan ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("skills")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "skills"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            Taksonomi Skill & Sumber ({skills.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("runs")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "runs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-4 h-4" />
            Riwayat worker_runs ({runs.length})
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4 py-8">
            <SkeletonTable rows={5} />
          </div>
        ) : (
          <>
            {/* TAB 1: KATALOG LOWONGAN */}
            {activeTab === "jobs" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobs.map((job) => (
                    <Card key={job.id} className="flex flex-col justify-between">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                              {job.sourceName}
                            </span>
                            <CardTitle className="text-base font-bold text-slate-900 mt-1 line-clamp-1">
                              {job.title}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                              {job.company} • {job.location}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pb-3">
                        <div className="flex flex-wrap gap-1">
                          {(job.requiredSkills || []).slice(0, 4).map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs rounded-b-xl">
                        <span className="text-slate-400 font-mono text-[11px]">{job.canonicalTitle}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(job)}
                            leftIcon={<Pencil className="w-3.5 h-3.5" />}
                            className="text-xs text-slate-600 hover:text-blue-600 px-2 py-1 h-auto"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateJob(job)}
                            leftIcon={<Copy className="w-3.5 h-3.5" />}
                            className="text-xs text-slate-600 hover:text-blue-600 px-2 py-1 h-auto"
                          >
                            Duplikasi
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteJob(job)}
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 h-auto"
                          >
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: TAKSONOMI SKILL & SUMBER */}
            {activeTab === "skills" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Master Skill Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tambah Skill Master Baru</CardTitle>
                      <CardDescription>
                        Tambahkan entitas skill terstandar ke dalam taksonomi pasar kerja.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateMasterSkill} className="space-y-3">
                        <TextInput
                          label="Nama Skill Master"
                          placeholder="cth. dbt, Looker Studio"
                          value={masterSkillName}
                          onChange={(e) => setMasterSkillName(e.target.value)}
                          required
                        />
                        <Select
                          label="Kategori Kompetensi"
                          value={masterSkillCategory}
                          onChange={(e) => setMasterSkillCategory(e.target.value)}
                          options={[
                            { label: "Data & Analytics", value: "Data & Analytics" },
                            { label: "Programming & Code", value: "Programming & Code" },
                            { label: "Database & Cloud", value: "Database & Cloud" },
                            { label: "Business & Strategy", value: "Business & Strategy" },
                          ]}
                        />
                        <Button variant="primary" size="sm" type="submit" className="w-full">
                          Tambah Master Skill
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Add Alias Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Pemetaan Alias & Sinonim Skill</CardTitle>
                      <CardDescription>
                        Menstandarkan istilah sinonim (cth: postgres $\to$ PostgreSQL) agar teragregasi di Market Skill Insights.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateAlias} className="space-y-3">
                        <TextInput
                          label="Kata Kunci Alias (Sinonim)"
                          placeholder="cth. ms sql, postgresql, dax"
                          value={newSkillAlias}
                          onChange={(e) => setNewSkillAlias(e.target.value)}
                          required
                        />
                        <TextInput
                          label="Target Skill Master"
                          placeholder="cth. SQL, DAX"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          required
                        />
                        <Button variant="outline" size="sm" type="submit" className="w-full">
                          Simpan Pemetaan Alias
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {/* Skills List & Sources List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Master Taksonomi Skill ({skills.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto space-y-2">
                      {skills.map((s) => (
                        <div key={s.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <strong className="text-slate-900 font-bold">{s.name}</strong>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                              {s.category}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {s.skill_aliases && s.skill_aliases.length > 0 ? (
                              s.skill_aliases.map((a) => (
                                <span key={a.id} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  {a.alias}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Belum ada alias terdaftar</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Metadata Sumber Lowongan ({sources.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {sources.map((src) => (
                        <div key={src.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                          <div>
                            <strong className="font-mono text-slate-900 block">{src.name}</strong>
                            <span className="text-slate-500 font-mono text-[11px]">{src.base_url}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            Aktif
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB 3: WORKER RUNS & GITHUB ACTIONS TRIGGER */}
            {activeTab === "runs" && (
              <div className="space-y-6">
                {/* Trigger Control Panel */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pemicu Sinkronisasi Worker (GitHub Actions & Live Crawler)</CardTitle>
                    <CardDescription>
                      Pipeline otomatis terjadwal via GitHub Actions (<code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">.github/workflows/worker.yml</code>) setiap hari pukul 02:00 UTC dan mendukung pemicu manual <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">workflow_dispatch</code>. Anda juga dapat memicu crawling on-demand langsung di bawah ini untuk demonstrasi live penjurian.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleTriggerWorker("greenhouse")}
                        disabled={isSubmitting}
                        leftIcon={<Play className="w-3.5 h-3.5" />}
                      >
                        Picu Greenhouse (Binance / Cloudflare)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTriggerWorker("lever")}
                        disabled={isSubmitting}
                        leftIcon={<Play className="w-3.5 h-3.5" />}
                      >
                        Picu Lever (Everseen / Kwalee)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTriggerWorker("jobstreet")}
                        disabled={isSubmitting}
                        leftIcon={<Play className="w-3.5 h-3.5" />}
                      >
                        Picu JobStreet Indonesia
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTriggerWorker("linkedin")}
                        disabled={isSubmitting}
                        leftIcon={<Play className="w-3.5 h-3.5" />}
                      >
                        Picu LinkedIn (Guest Scraper)
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Audit Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Log Audit Riwayat Eksekusi (worker_runs)</CardTitle>
                    <CardDescription>
                      Mencatat transparansi data crawler: jumlah fetch, data baru, deduplikasi, dan isolasi error.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataTable data={runs} columns={runColumns} keyExtractor={(row) => row.id} />
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Modal Tambah Lowongan */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Tambah Lowongan Manual (Pipeline Processing)</h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextInput
                    label="Judul Pekerjaan *"
                    placeholder="cth. Data Analyst Senior"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                  <TextInput
                    label="Nama Perusahaan *"
                    placeholder="cth. Bank Mandiri Digital"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextInput
                    label="Lokasi"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                  />
                  <Select
                    label="Role Target"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    options={[
                      { label: "Data Analyst", value: "Data Analyst" },
                      { label: "BI Analyst", value: "BI Analyst" },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Senioritas"
                    value={formSeniority}
                    onChange={(e) => setFormSeniority(e.target.value)}
                    options={[
                      { label: "Junior", value: "Junior" },
                      { label: "Mid", value: "Mid" },
                      { label: "Senior", value: "Senior" },
                      { label: "Lead", value: "Lead" },
                    ]}
                  />
                  <TextInput
                    label="Min Pengalaman (Tahun)"
                    type="number"
                    value={formExperience}
                    onChange={(e) => setFormExperience(e.target.value)}
                  />
                  <Select
                    label="Pendidikan"
                    value={formEducation}
                    onChange={(e) => setFormEducation(e.target.value)}
                    options={[
                      { label: "Sarjana / Bachelor", value: "Bachelor" },
                      { label: "Master / S2", value: "Master" },
                      { label: "Diploma / D3", value: "Diploma" },
                      { label: "Semua Jurusan / Terbuka", value: "All" },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextInput
                    label="Skill Wajib (Pisahkan koma)"
                    value={formRequiredSkills}
                    onChange={(e) => setFormRequiredSkills(e.target.value)}
                    placeholder="SQL, Python, Excel"
                  />
                  <TextInput
                    label="Skill Tambahan (Pisahkan koma)"
                    value={formPreferredSkills}
                    onChange={(e) => setFormPreferredSkills(e.target.value)}
                    placeholder="Tableau, Power BI"
                  />
                </div>

                <Textarea
                  label="Deskripsi Lengkap Lowongan *"
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Tuliskan tanggung jawab dan kualifikasi lowongan..."
                  required
                />

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowAddModal(false)}>
                    Batal
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Menyimpan & Memproses Pipeline..." : "Simpan ke Katalog Lowongan"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Lowongan */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Edit Lowongan Pekerjaan</h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateJob} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextInput
                    label="Judul Pekerjaan *"
                    placeholder="cth. Data Analyst Senior"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                  <TextInput
                    label="Nama Perusahaan *"
                    placeholder="cth. Bank Mandiri Digital"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextInput
                    label="Lokasi"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                  />
                  <Select
                    label="Role Target"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    options={[
                      { label: "Data Analyst", value: "Data Analyst" },
                      { label: "BI Analyst", value: "BI Analyst" },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Senioritas"
                    value={editSeniority}
                    onChange={(e) => setEditSeniority(e.target.value)}
                    options={[
                      { label: "Junior", value: "Junior" },
                      { label: "Mid", value: "Mid" },
                      { label: "Senior", value: "Senior" },
                      { label: "Lead", value: "Lead" },
                    ]}
                  />
                  <TextInput
                    label="Min Pengalaman (Tahun)"
                    type="number"
                    value={editExperience}
                    onChange={(e) => setEditExperience(e.target.value)}
                  />
                  <Select
                    label="Pendidikan"
                    value={editEducation}
                    onChange={(e) => setEditEducation(e.target.value)}
                    options={[
                      { label: "Sarjana / Bachelor", value: "Bachelor" },
                      { label: "Master / S2", value: "Master" },
                      { label: "Diploma / D3", value: "Diploma" },
                      { label: "Semua Jurusan / Terbuka", value: "All" },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextInput
                    label="Skill Wajib (Pisahkan koma)"
                    value={editRequiredSkills}
                    onChange={(e) => setEditRequiredSkills(e.target.value)}
                    placeholder="SQL, Python, Excel"
                  />
                  <TextInput
                    label="Skill Tambahan (Pisahkan koma)"
                    value={editPreferredSkills}
                    onChange={(e) => setEditPreferredSkills(e.target.value)}
                    placeholder="Tableau, Power BI"
                  />
                </div>

                <Textarea
                  label="Deskripsi Lengkap Lowongan *"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Tuliskan tanggung jawab dan kualifikasi lowongan..."
                  required
                />

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowEditModal(false)}>
                    Batal
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Menyimpan Perubahan..." : "Simpan Perubahan Lowongan"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
