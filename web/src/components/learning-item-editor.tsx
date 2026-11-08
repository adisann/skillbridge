"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useLearning } from "@/context/learning-context";
import { LEARNING_PRIORITIES, noteSegments, type LearningItem } from "@/lib/learning";
import { Button } from "@/components/ui/button";

export function LearningItemEditor({ item }: { item: LearningItem }) {
  const learning = useLearning();
  const [notes, setNotes] = useState(item.notes || "");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const act = async (action: () => Promise<void>, message: string) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setStatus("");
    try { await action(); setStatus(message); }
    catch (e) { setError((e as Error).message); }
    finally { lock.current = false; setBusy(false); }
  };
  const hasDuplicates = learning.items.some((it) => it.duplicateOf === item.id);
  return <article className="rounded-xl border border-sb-border p-4 bg-white/80 space-y-3 min-w-0">
    <div className="flex flex-wrap justify-between items-start gap-3">
      <label className="flex items-start gap-2 font-bold text-sb-navy">
        <input type="checkbox" checked={item.isDone} disabled={busy} className="mt-1" onChange={(e) => void act(() => learning.update(item.id, { isDone: e.target.checked }), "Progres tersimpan.")} />
        <span className={item.isDone ? "line-through" : ""}>{item.skillName}</span>
      </label>
      <Button size="sm" variant="ghost" disabled={busy || hasDuplicates} onClick={() => {
        if (window.confirm(`Hapus target ${item.skillName} beserta catatannya?`)) void act(() => learning.remove(item.id), "Target dihapus.");
      }}>Hapus</Button>
    </div>
    {(item.duplicateOf || hasDuplicates) && <p className="text-xs text-sb-warning">Salinan lama tersedia di bawah target. Tinjau dan hapus salinan terlebih dahulu untuk menghapus target utama.</p>}
    <p className="text-xs text-sb-text-2">{item.reason}</p>
    {item.sourceJobId && <Link className="text-xs text-sb-blue underline" href={`/jobs/${item.sourceJobId}`}>Lowongan asal</Link>}
    <label className="block text-xs font-semibold text-sb-navy">Prioritas belajar
      <select className="ml-2 rounded-lg border border-sb-border bg-white p-2" value={item.priority} disabled={busy}
        onChange={(e) => void act(() => learning.update(item.id, { priority: e.target.value }), "Prioritas tersimpan.")}>
        {!LEARNING_PRIORITIES.includes(item.priority as typeof LEARNING_PRIORITIES[number]) && <option>{item.priority}</option>}
        {LEARNING_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
      </select>
    </label>
    <label className="block text-xs font-semibold text-sb-navy">Catatan & tautan belajar
      <textarea className="mt-1 w-full min-h-24 rounded-xl border border-sb-border p-3 text-sm font-normal" maxLength={20000} value={notes} onChange={(e) => { setNotes(e.target.value); setStatus(""); }} placeholder="Tautan kursus, video, atau materi yang ingin dilanjutkan…" />
    </label>
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" variant="outline" disabled={busy || notes === (item.notes || "")} onClick={() => void act(() => learning.update(item.id, { notes }), "Catatan tersimpan.")}>Simpan catatan</Button>
      <span role="status" className="text-xs text-sb-good">{busy ? "Menyimpan…" : status}</span>
    </div>
    {error && <p role="alert" className="text-xs text-sb-critical">{error}</p>}
    {item.notes && <p className="text-xs text-sb-text-2 whitespace-pre-wrap break-words">{noteSegments(item.notes).map((part, i) => part.href
      ? <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" className="text-sb-blue underline">{part.text}</a> : <span key={i}>{part.text}</span>)}</p>}
  </article>;
}
