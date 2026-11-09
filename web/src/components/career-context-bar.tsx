"use client";

import { useState } from "react";
import Link from "next/link";
import { useCareer } from "@/context/career-context";
import { Button } from "@/components/ui/button";

export function CareerContextBar({ beforeChange }: { beforeChange?: () => boolean | Promise<boolean> }) {
  const career = useCareer();
  const [target, setTarget] = useState("");
  const change = async (patch: { resumeId?: string; targetRole?: string }) => {
    if (!beforeChange || await beforeChange()) return career.change(patch);
  };
  return <details className="rounded-2xl border border-sb-border bg-white/80 p-3 text-sm text-sb-navy">
    <summary className="cursor-pointer font-semibold break-words">CV: {career.activeResume?.filename || "Belum dipilih"} · Target: {career.targetRole || "Belum dipilih"}<span className="ml-2 text-xs text-sb-blue">Ubah CV / target</span></summary>
    <section aria-label="CV dan target aktif" className="space-y-3 pt-3">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="min-w-0 space-y-1"><span className="block font-semibold">CV aktif</span>
        <select className="w-full min-w-0 border border-sb-border rounded-xl p-2 bg-white" value={career.activeResume?.id || ""} disabled={career.busy} onChange={(e) => void change({ resumeId: e.target.value })}>
          {!career.activeResume && <option value="">Pilih CV tersimpan</option>}
          {career.resumes.map((r) => <option key={r.id} value={r.id}>{r.filename}{r.is_active ? " (aktif)" : ""}</option>)}
        </select>
      </label>
      <label className="min-w-0 space-y-1"><span className="block font-semibold">Target karier aktif</span>
        <select className="w-full min-w-0 border border-sb-border rounded-xl p-2 bg-white" value={career.targetRole} disabled={career.busy} onChange={(e) => void change({ targetRole: e.target.value })}>
          {!career.targetRole && <option value="">Pilih target</option>}
          {Array.from(new Set([...career.targetRoles, career.targetRole].filter(Boolean))).map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
    </div>
    <form className="flex flex-wrap items-end gap-2" onSubmit={async (e) => { e.preventDefault(); if (target.trim()) { await change({ targetRole: target.trim() }); setTarget(""); } }}>
      <label className="w-full sm:flex-1 sm:min-w-48 text-xs">Tambah target karier
        <input className="block w-full border border-sb-border rounded-xl p-2 mt-1" value={target} maxLength={150} placeholder="cth. Data Scientist atau Desainer Grafis" onChange={(e) => setTarget(e.target.value)} />
      </label>
      <Button size="sm" type="submit" disabled={!target.trim() || career.busy}>Simpan & aktifkan</Button>
      <Link href="/cv#upload" className="text-xs text-sb-blue underline p-2">Unggah CV baru</Link>
    </form>
    <p className="text-xs text-sb-text-2">Hasil menggunakan CV dan target aktif. Rencana belajar dan lowongan tersimpan tetap tersedia saat berganti konteks.</p>
    {career.error && <p role="alert" className="text-xs text-sb-critical">{career.error}</p>}
  </section></details>;
}
