"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical } from "lucide-react";
import { confirmAction } from "@/lib/dialogs";
import { useLearning } from "@/context/learning-context";
import { useAsyncTask } from "@/context/async-task-context";
import { LEARNING_PRIORITIES, noteSegments, type LearningItem } from "@/lib/learning";
import { Button } from "@/components/ui/button";

export function LearningItemEditor({ item, draggable = false }: { item: LearningItem; draggable?: boolean }) {
  const learning = useLearning();
  const { showToast } = useAsyncTask();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const act = async (action: () => Promise<void>, message: string) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await action(); showToast(message); }
    catch (e) { setError((e as Error).message); }
    finally { lock.current = false; setBusy(false); }
  };
  const hasDuplicates = learning.items.some(it => it.duplicateOf === item.id);
  const priorityIndex = LEARNING_PRIORITIES.indexOf(item.priority as typeof LEARNING_PRIORITIES[number]);
  const move = (direction: number) => {
    const priority = LEARNING_PRIORITIES[priorityIndex + direction];
    if (priority) void act(() => learning.update(item.id, { priority }), `Prioritas ${priority.toLowerCase()} tersimpan.`);
  };
  return <article className="rounded-2xl border border-sb-border bg-white/90 min-w-0">
    <div className="flex items-center gap-stack-xs p-stack-sm sm:p-stack-md">
      {draggable && <button type="button" draggable={!busy} onDragStart={e => { e.dataTransfer.setData("text/plain", item.id); e.dataTransfer.effectAllowed = "move"; }} className="cursor-grab p-stack-2xs text-sb-text-2 touch-none" aria-label={`Geser prioritas ${item.skillName}`} title="Seret ke kelompok prioritas lain"><GripVertical className="w-4 h-4"/></button>}
      <input aria-label={`Selesai mempelajari ${item.skillName}`} type="checkbox" checked={item.isDone} disabled={busy} className="w-4 h-4 shrink-0" onChange={e => void act(() => learning.update(item.id, { isDone: e.target.checked }), "Progres tersimpan.")}/>
      <button type="button" className="flex-1 min-w-0 flex items-center gap-stack-sm text-left rounded-lg p-stack-2xs focus-visible:outline-2 focus-visible:outline-sb-blue" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        <span className="flex-1 min-w-0"><span className={`block font-bold text-sm text-sb-navy break-words ${item.isDone ? "line-through" : ""}`}>{item.skillName}</span><span className="block text-xs text-sb-text-2 mt-stack-2xs">{item.priority}{notes !== (item.notes || "") ? " · Catatan belum disimpan" : item.notes ? " · Ada catatan" : ""}</span></span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-sb-blue transition-transform ${open ? "rotate-180" : ""}`}/>
      </button>
      {draggable && <div className="flex shrink-0"><button aria-label={`Naikkan prioritas ${item.skillName}`} disabled={busy || priorityIndex <= 0} onClick={() => move(-1)} className="p-stack-xs rounded-lg text-sb-blue disabled:opacity-30 hover:bg-sb-mist-faint"><ArrowUp className="w-4 h-4"/></button><button aria-label={`Turunkan prioritas ${item.skillName}`} disabled={busy || priorityIndex >= 2} onClick={() => move(1)} className="p-stack-xs rounded-lg text-sb-blue disabled:opacity-30 hover:bg-sb-mist-faint"><ArrowDown className="w-4 h-4"/></button></div>}
    </div>
    <div id={panelId} hidden={!open} className="p-stack-md pt-0 space-y-stack-sm border-t border-sb-border">
      {(item.duplicateOf || hasDuplicates) && <p className="text-xs text-sb-text-2 pt-stack-sm">Salinan lama tetap tersimpan. Tinjau salinan sebelum menghapus target utama.</p>}
      <p className="text-xs text-sb-text-2 pt-stack-sm">{item.reason}</p>
      {item.sourceJobId && <Link className="text-xs text-sb-blue underline" href={`/jobs/${item.sourceJobId}`}>Lowongan asal</Link>}
      <label className="block text-xs font-semibold text-sb-navy">Prioritas belajar<select className="ml-stack-xs rounded-lg border border-sb-border bg-white p-stack-xs" value={item.priority} disabled={busy} onChange={e => void act(() => learning.update(item.id, { priority: e.target.value }), "Prioritas tersimpan.")}>{LEARNING_PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></label>
      <label className="block text-xs font-semibold text-sb-navy">Catatan & tautan belajar<textarea className="mt-stack-2xs w-full min-h-24 rounded-xl border border-sb-border p-stack-sm text-sm font-normal" maxLength={20000} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tautan kursus, video, atau materi yang ingin dilanjutkan…"/></label>
      <div className="flex flex-wrap items-center justify-between gap-stack-sm"><Button size="sm" variant="outline" disabled={busy || notes === (item.notes || "")} onClick={() => void act(() => learning.update(item.id, { notes }), "Catatan tersimpan.")}>Simpan catatan</Button><Button size="sm" variant="ghost" className="text-sb-critical" disabled={busy || hasDuplicates} onClick={async () => { if (await confirmAction(`Hapus target ${item.skillName} beserta catatannya?`)) await act(() => learning.remove(item.id), "Target dihapus."); }}>Hapus target</Button></div>
      {item.notes && <p className="text-xs text-sb-text-2 whitespace-pre-wrap break-words">{noteSegments(item.notes).map((part,i) => part.href ? <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" className="text-sb-blue underline">{part.text}</a> : <span key={i}>{part.text}</span>)}</p>}
    </div>
    {busy && <p role="status" className="px-stack-md pb-stack-sm text-xs text-sb-text-2">Menyimpan…</p>}
    {error && <p role="alert" className="px-stack-md pb-stack-sm text-xs text-sb-critical">{error}</p>}
  </article>;
}
