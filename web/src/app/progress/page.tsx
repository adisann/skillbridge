"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchBadge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { SkeletonCard } from "@/components/ui/loading";
import { LearningPlanList } from "@/components/learning-plan-list";
import { useAuth } from "@/lib/supabase/auth-context";
import { useLearning } from "@/context/learning-context";
import { useCareer } from "@/context/career-context";
import { LEARNING_PRIORITIES, normalizeSkillName } from "@/lib/learning";
import { fetchDeduped } from "@/lib/fetcher";

interface SavedJobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  sourceName: string;
  sourceUrl?: string;
  matchScore: number | null;
  matchStatus: "match" | "underqualified" | "potentially_overqualified" | "insufficient_evidence";
  matchedSkills: string[];
  missingSkills: string[];
}

export default function ProgressPage() {
  return <ProtectedRoute><ProgressContent /></ProtectedRoute>;
}

function ProgressContent() {
  const learning = useLearning();
  const { user } = useAuth();
  const career = useCareer();
  const targetRole = career.targetRole || user?.targetRole;
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [tab, setTab] = useState("learning");
  const [newTitle, setNewTitle] = useState("");
  const [priority, setPriority] = useState("Tinggi");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [savedLoading, setSavedLoading] = useState(true);
  const addLock = useRef(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string[]>([]);
  const removeLocks = useRef(new Set<string>());
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    let live = true;
    fetchDeduped<{ savedJobs: SavedJobItem[] }>("/api/saved-jobs").then((data) => { if (live) setSavedJobs(data.savedJobs); })
      .catch((e: Error) => { if (live) setError(e.message); }).finally(() => { if (live) setSavedLoading(false); });
    return () => { live = false; };
  }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addLock.current || !newTitle.trim()) return;
    addLock.current = true; setAdding(true); setError(""); setFeedback("");
    try {
      const result = await learning.add(newTitle, "Ditambahkan oleh pengguna.", priority);
      if (result) setFeedback(`${result.skillName}: sudah ditambahkan. Prioritas dan catatan yang sudah ada dipertahankan.`);
    } catch (e) { setError((e as Error).message); }
    finally { addLock.current = false; setAdding(false); }
  };
  const handleUnsaveJob = async (id: string) => {
    if (removeLocks.current.has(id)) return;
    removeLocks.current.add(id); setRemoving((p) => [...p, id]);
    try {
      await fetchDeduped("/api/saved-jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: id }) });
      setSavedJobs((p) => p.filter((j) => j.id !== id));
    } catch (e) { setError((e as Error).message); }
    finally { removeLocks.current.delete(id); setRemoving((p) => p.filter((v) => v !== id)); }
  };
  const uniqueItems = learning.items.filter((it) => !it.duplicateOf);
  const done = uniqueItems.filter((it) => it.isDone).length;
  return <div className="max-w-7xl mx-auto page-shell page-stack">
    <div className="page-banner rounded-3xl p-stack-lg sm:p-stack-xl border border-sb-border space-y-stack-sm">
      <div className="flex flex-wrap items-center gap-stack-sm">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-sb-navy">Rencana Belajar</h1>
        {targetRole && (
          <p className="max-w-full rounded-xl border border-sb-blue/20 bg-sb-mist-soft px-stack-sm py-stack-xs text-sm leading-relaxed text-sb-text-2 [overflow-wrap:anywhere]">
            dengan target karier <span className="font-semibold text-sb-blue">{targetRole}</span>
          </p>
        )}
      </div>
      <p className="text-sm text-sb-text-2">{done} dari {uniqueItems.length} skill selesai dipelajari. Status belajar tidak otomatis mengubah isi CV.</p>
      <Link className="text-sb-blue text-sm underline" href="/insights">Lihat Tren Skill</Link>
    </div>
    <div role="tablist" aria-label="Rencana belajar dan lowongan" className="flex border-b border-sb-border gap-stack-xs">
      {[{ id: "learning", label: "Target Belajar" }, { id: "saved", label: "Lowongan Tersimpan" }].map((t,i) => <button key={t.id} ref={(el) => { tabRefs.current[i] = el; }} type="button" id={`tab-${t.id}`} role="tab" aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} tabIndex={tab === t.id ? 0 : -1}
        className={`px-stack-sm py-stack-sm text-sm font-bold border-b-2 focus-visible:outline-2 focus-visible:outline-sb-blue ${tab === t.id ? "border-sb-blue text-sb-blue" : "border-transparent text-sb-text-2"}`}
        onClick={() => setTab(t.id)} onKeyDown={(e) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
            e.preventDefault(); const next = e.key === "Home" ? 0 : e.key === "End" ? 1 : 1-i;
            setTab(next === 0 ? "learning" : "saved"); tabRefs.current[next]?.focus();
          }
        }}>{t.label}</button>)}
    </div>
    <section role="tabpanel" id="panel-learning" aria-labelledby="tab-learning" hidden={tab !== "learning"} tabIndex={0} className="space-y-stack-md">
      <details className="rounded-2xl border border-sb-border bg-white/80 p-stack-md"><summary className="cursor-pointer font-semibold text-sm text-sb-blue">Tambah target belajar</summary>
      <form onSubmit={add} className="space-y-stack-sm pt-stack-md">
        <div className="flex flex-col sm:flex-row sm:items-end gap-stack-sm">
          <label className="flex-1 text-sm font-semibold text-sb-navy">Skill yang ingin dipelajari
            <input className="block w-full border border-sb-border rounded-xl p-stack-sm mt-stack-2xs" value={newTitle} maxLength={200} onChange={(e) => { setNewTitle(e.target.value); setFeedback(""); }} placeholder="cth. SQL, React, Teamwork" />
          </label>
          <label className="text-sm font-semibold text-sb-navy">Prioritas belajar
            <select className="block border border-sb-border rounded-xl p-stack-sm mt-stack-2xs bg-white" value={priority} onChange={(e) => setPriority(e.target.value)}>{LEARNING_PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
          </label>
          <Button type="submit" isLoading={adding} disabled={!normalizeSkillName(newTitle) || !!learning.find(newTitle) || learning.isLoading || !!learning.loadError}>{learning.find(newTitle) ? "Sudah ditambahkan" : adding ? "Menambahkan…" : "Tambah"}</Button>
        </div>
        <p className="text-xs text-sb-text-2">Prioritas menentukan urutan fokus belajar, bukan tingkat penguasaan skill. Prioritas otomatis dapat kamu ubah.</p>

      </form></details>
      <p role="status" className="text-xs text-sb-good">{feedback}</p>
      {learning.loadError && <p role="alert" className="text-sm text-sb-critical">{learning.loadError} <button onClick={() => void learning.reload()} className="underline">Coba lagi</button></p>}
      {learning.isLoading ? <SkeletonCard /> : !uniqueItems.length ? <p className="text-sm text-sb-text-2 p-stack-xl">Belum ada target belajar. Tambahkan skill di atas atau dari Tren Skill dan detail lowongan.</p> : <LearningPlanList userKey={user?.id || "guest"} />}
    </section>
    <section role="tabpanel" id="panel-saved" aria-labelledby="tab-saved" hidden={tab !== "saved"} tabIndex={0} className="space-y-stack-md">
      {savedLoading ? <SkeletonCard /> : <div className="space-y-stack-sm">
                {/* Tracker CTA Callout */}
                <div className="p-stack-sm glass-panel border border-sb-border rounded-xl space-y-stack-xs">
                  <div className="space-y-stack-3xs">
                    <p className="text-xs font-bold text-sb-navy">Pelacakan Lamaran Kerja</p>
                    <p className="text-[11px] text-sb-text-2 leading-relaxed">
                      Atur prioritas dan pantau tahapan seleksimu.
                    </p>
                  </div>
                  <Link href="/tracker" className="block">
                    <Button
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5 shrink-0" />}
                      className="w-full text-xs justify-center whitespace-nowrap"
                    >
                      Buka Pelacakan
                    </Button>
                  </Link>
                </div>

                {savedJobs.length === 0 ? (
                  <div className="py-stack-3xl text-center text-xs text-sb-text-2 border border-dashed rounded-2xl border-sb-border bg-white/40">
                    Belum ada lowongan yang disimpan. Buka{" "}
                    <Link href="/jobs" className="text-sb-blue font-semibold hover:underline">
                      Lowongan
                    </Link>{" "}
                    dan klik ikon simpan pada kartu lowongan.
                  </div>
                ) : (
                  savedJobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-stack-md rounded-xl border border-sb-border bg-white/70 hover:bg-white hover:border-sb-blue/40 transition-ui space-y-stack-xs"
                    >
                      <div className="flex items-start justify-between gap-stack-xs">
                        <div className="space-y-stack-3xs">
                          <h4 className="text-xs font-bold text-sb-navy line-clamp-1">{j.title}</h4>
                          <p className="text-[11px] text-sb-text-2 font-medium">
                            {j.company} • {j.location}
                          </p>
                        </div>
                      </div>
                      <MatchBadge status={j.matchStatus} score={j.matchScore} size="sm" />

                      <div className="space-y-stack-2xs text-xs">
                        <div className="flex flex-wrap gap-stack-2xs">
                          {j.matchedSkills.slice(0, 3).map((s) => (
                            <span key={s} className="inline-flex items-center gap-stack-2xs px-stack-xs py-stack-3xs rounded-full bg-sb-good/10 text-sb-good border border-sb-good/30 text-xs font-semibold">
                              <Check className="w-2.5 h-2.5 text-sb-good" />
                              {s}
                            </span>
                          ))}
                        </div>
                        {j.missingSkills.length > 0 && (
                          <div className="flex flex-wrap items-center gap-stack-2xs">
                            <span className="text-[11px] font-semibold text-sb-text-2">Belum ditemukan:</span>
                            {j.missingSkills.slice(0, 2).map((s) => (
                              <span key={s} className="px-stack-xs py-stack-3xs rounded-full bg-sb-mist-soft border border-sb-border text-xs text-sb-text-2 font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-stack-xs border-t border-sb-border flex items-center justify-between text-xs">
                        <button
                          type="button"
                          disabled={removing.includes(j.id)}
                          onClick={() => handleUnsaveJob(j.id)}
                          className="text-sb-text-2 hover:text-sb-critical text-[11px] hover:underline"
                        >
                          Hapus
                        </button>
                        <div className="flex items-center gap-stack-xs">
                          <Link
                            href={`/tracker`}
                            className="text-sb-blue font-semibold hover:underline text-[11px]"
                          >
                            Atur Pipeline
                          </Link>
                          <span className="text-sb-border">•</span>
                          <Link
                            href={`/jobs/${j.id}`}
                            className="text-sb-blue font-semibold hover:underline inline-flex items-center gap-stack-2xs text-[11px]"
                          >
                            Rincian <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
      </div>}
    </section>
    {error && <p role="alert" className="text-sm text-sb-critical">{error}</p>}
  </div>;
}
