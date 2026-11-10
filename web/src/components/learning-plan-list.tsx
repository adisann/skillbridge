"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useLearning } from "@/context/learning-context";
import { LEARNING_PRIORITIES, displayLearningPriority, noteSegments, type LearningItem } from "@/lib/learning";
import { LearningItemEditor } from "@/components/learning-item-editor";
import { Button } from "@/components/ui/button";
import { confirmAction } from "@/lib/dialogs";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "todo" | "done";
type SortMode = "custom" | "priority";

const PRIORITY_TONE: Record<string, string> = {
  Tinggi: "bg-sb-critical/10 text-sb-critical border-sb-critical/25",
  Sedang: "bg-sb-warning/10 text-sb-warning border-sb-warning/25",
  Rendah: "bg-sb-mist-soft text-sb-navy border-sb-border",
};

/** Urutan manual disimpan per akun di browser (kolom urutan belum ada di database). */
function useCustomOrder(userKey: string) {
  const storageKey = `sb-learning-order:${userKey}`;
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const save = (next: string[]) => {
    setOrder(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* penyimpanan browser tidak tersedia: urutan hanya berlaku selama halaman terbuka */
    }
  };
  return [order, save] as const;
}

function NotesCell({ item }: { item: LearningItem }) {
  const learning = useLearning();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          autoFocus
          aria-label={`Catatan ${item.skillName}`}
          className="w-full min-h-24 rounded-xl border border-sb-border p-2.5 text-sm text-sb-navy focus:outline-none focus:ring-2 focus:ring-sb-blue"
          maxLength={20000}
          value={notes}
          disabled={busy}
          placeholder="Tautan kursus, video, atau materi yang ingin dilanjutkan…"
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={busy || notes === (item.notes || "")}
            isLoading={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await learning.update(item.id, { notes });
                setEditing(false);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Simpan
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setNotes(item.notes || "");
              setEditing(false);
            }}
          >
            Batal
          </Button>
        </div>
        {error && <p role="alert" className="text-xs text-sb-critical">{error}</p>}
      </div>
    );
  }

  if (!item.notes) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-sb-blue hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        Tambah catatan
      </button>
    );
  }

  return (
    <div className="group/notes flex items-start gap-2 min-w-0">
      <p className="flex-1 min-w-0 text-sm text-sb-navy whitespace-pre-wrap break-words line-clamp-3">
        {noteSegments(item.notes).map((part, i) =>
          part.href ? (
            <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" className="text-sb-blue underline">
              {part.text}
            </a>
          ) : (
            <span key={i}>{part.text}</span>
          )
        )}
      </p>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Ubah catatan ${item.skillName}`}
        title="Ubah catatan"
        className="p-1.5 rounded-lg text-sb-text-2 hover:text-sb-navy hover:bg-sb-mist-faint shrink-0"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function LearningPlanList({ userKey }: { userKey: string }) {
  const learning = useLearning();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("custom");
  const [order, saveOrder] = useCustomOrder(userKey);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [rowError, setRowError] = useState("");
  const [busyIds, setBusyIds] = useState<string[]>([]);
  // Drag hanya boleh dimulai dari pegangan, supaya teks & kontrol di baris tetap bisa dipakai
  const handleArmed = useRef<string | null>(null);

  const items = learning.items.filter((it) => !it.duplicateOf);

  // Item baru (belum ada di urutan) tampil paling atas, sisanya mengikuti urutan manual
  const ordered = useMemo(() => {
    const position = new Map(order.map((id, i) => [id, i]));
    const list = [...items];
    if (sortMode === "priority") {
      const rank = (p: string) => LEARNING_PRIORITIES.indexOf(displayLearningPriority(p) as (typeof LEARNING_PRIORITIES)[number]);
      return list.sort((a, b) => rank(a.priority) - rank(b.priority) || Number(a.isDone) - Number(b.isDone) || a.skillName.localeCompare(b.skillName));
    }
    return list.sort((a, b) => (position.get(a.id) ?? -1) - (position.get(b.id) ?? -1));
  }, [items, order, sortMode]);

  const visible = ordered.filter(
    (it) =>
      (status === "all" || (status === "done" ? it.isDone : !it.isDone)) &&
      (priorityFilter === "all" || displayLearningPriority(it.priority) === priorityFilter)
  );
  const canReorder = sortMode === "custom";
  const fullIds = ordered.map((it) => it.id);

  const moveTo = (id: string, targetId: string) => {
    if (id === targetId) return;
    const next = fullIds.filter((x) => x !== id);
    const targetIndex = next.indexOf(targetId);
    const from = fullIds.indexOf(id);
    const to = fullIds.indexOf(targetId);
    next.splice(from < to ? targetIndex + 1 : targetIndex, 0, id);
    saveOrder(next);
  };
  const moveBy = (id: string, delta: number) => {
    const visibleIds = visible.map((it) => it.id);
    const target = visibleIds[visibleIds.indexOf(id) + delta];
    if (target) moveTo(id, target);
  };

  const run = async (id: string, action: () => Promise<void>) => {
    if (busyIds.includes(id)) return;
    setBusyIds((ids) => [...ids, id]);
    setRowError("");
    try {
      await action();
    } catch (e) {
      setRowError((e as Error).message);
    } finally {
      setBusyIds((ids) => ids.filter((x) => x !== id));
    }
  };

  const counts = {
    all: items.length,
    todo: items.filter((it) => !it.isDone).length,
    done: items.filter((it) => it.isDone).length,
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div role="group" aria-label="Filter status belajar" className="inline-flex rounded-xl border border-sb-border bg-white p-1 self-start">
          {([
            ["all", "Semua"],
            ["todo", "Belum dipelajari"],
            ["done", "Sudah dipelajari"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                status === value ? "bg-sb-sky text-sb-navy" : "text-sb-text-2 hover:text-sb-navy"
              )}
            >
              {label} <span className="font-mono-metric">({counts[value]})</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-sb-navy">
            Prioritas
            <select
              className="h-9 rounded-lg border border-sb-border bg-white px-2 text-xs"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">Semua</option>
              {LEARNING_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-sb-navy">
            Urutkan
            <select
              className="h-9 rounded-lg border border-sb-border bg-white px-2 text-xs"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              <option value="custom">Urutan saya</option>
              <option value="priority">Prioritas tertinggi dulu</option>
            </select>
          </label>
        </div>
      </div>

      <p className="text-xs text-sb-text-2">
        {canReorder
          ? "Seret pegangan di kiri atau pakai tombol panah untuk mengatur urutan belajar."
          : "Pilih “Urutan saya” untuk mengatur urutan dengan menyeret."}
      </p>

      {rowError && <p role="alert" className="text-xs text-sb-critical">{rowError}</p>}

      <div className="rounded-2xl border border-sb-border bg-white/80 overflow-hidden">
        <div className="hidden md:grid grid-cols-[2.5rem_minmax(0,1.4fr)_8rem_minmax(0,2fr)_6.5rem] gap-3 px-4 py-2.5 border-b border-sb-border bg-white/70 text-[11px] font-bold uppercase tracking-wider text-sb-text-2">
          <span><span className="sr-only">Urutan</span></span>
          <span>Skill</span>
          <span>Prioritas</span>
          <span>Catatan</span>
          <span className="text-right">Aksi</span>
        </div>

        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-sb-text-2">Tidak ada target belajar untuk filter ini.</p>
        ) : (
          <ul>
            {visible.map((item, index) => {
              const busy = busyIds.includes(item.id);
              const duplicates = learning.items.filter((it) => it.duplicateOf === item.id);
              const priority = displayLearningPriority(item.priority);
              return (
                <li
                  key={item.id}
                  draggable={canReorder}
                  onDragStart={(e) => {
                    if (handleArmed.current !== item.id) {
                      e.preventDefault();
                      return;
                    }
                    setDragId(item.id);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", item.id);
                  }}
                  onDragOver={(e) => {
                    if (!dragId || dragId === item.id) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (overId !== item.id) setOverId(item.id);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain") || dragId;
                    if (id) moveTo(id, item.id);
                    setDragId(null);
                    setOverId(null);
                  }}
                  onDragEnd={() => {
                    handleArmed.current = null;
                    setDragId(null);
                    setOverId(null);
                  }}
                  className={cn(
                    "border-t border-sb-border first:border-t-0 transition-colors",
                    dragId === item.id && "opacity-50",
                    overId === item.id && dragId !== item.id && "bg-sb-mist-faint shadow-[inset_0_2px_0_0_var(--sb-blue)]"
                  )}
                >
                  <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] md:grid-cols-[2.5rem_minmax(0,1.4fr)_8rem_minmax(0,2fr)_6.5rem] gap-x-3 gap-y-2 items-start px-4 py-3">
                    <div className="flex flex-col items-center gap-0.5 pt-0.5">
                      <span
                        role="button"
                        tabIndex={-1}
                        aria-hidden="true"
                        onPointerDown={() => {
                          if (canReorder) handleArmed.current = item.id;
                        }}
                        onPointerUp={() => {
                          handleArmed.current = null;
                        }}
                        className={cn("p-1 rounded text-sb-text-2", canReorder ? "cursor-grab active:cursor-grabbing hover:bg-sb-mist-faint" : "opacity-30 cursor-not-allowed")}
                        title={canReorder ? "Seret untuk mengubah urutan" : undefined}
                      >
                        <GripVertical className="w-4 h-4" />
                      </span>
                      {canReorder && (
                        <div className="flex flex-col">
                          <button type="button" aria-label={`Pindahkan ${item.skillName} ke atas`} disabled={index === 0} onClick={() => moveBy(item.id, -1)} className="p-0.5 text-sb-blue disabled:opacity-25">
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" aria-label={`Pindahkan ${item.skillName} ke bawah`} disabled={index === visible.length - 1} onClick={() => moveBy(item.id, 1)} className="p-0.5 text-sb-blue disabled:opacity-25">
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-0.5 w-4 h-4 shrink-0"
                          checked={item.isDone}
                          disabled={busy}
                          onChange={(e) => void run(item.id, () => learning.update(item.id, { isDone: e.target.checked }))}
                          aria-label={`Tandai ${item.skillName} sudah dipelajari`}
                        />
                        <span className="min-w-0">
                          <span className={cn("block text-sm font-bold text-sb-navy break-words", item.isDone && "line-through text-sb-text-2")}>{item.skillName}</span>
                          {item.reason && <span className="block text-xs text-sb-text-2 mt-0.5 line-clamp-2">{item.reason}</span>}
                        </span>
                      </label>
                      {item.sourceJobId && (
                        <Link href={`/jobs/${item.sourceJobId}`} className="mt-1 ml-6.5 inline-flex items-center gap-1 text-xs text-sb-blue hover:underline">
                          Lowongan asal <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    <div className="col-start-2 md:col-start-auto">
                      <select
                        aria-label={`Prioritas ${item.skillName}`}
                        value={priority}
                        disabled={busy}
                        onChange={(e) => void run(item.id, () => learning.update(item.id, { priority: e.target.value }))}
                        className={cn("h-8 rounded-full border px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sb-blue", PRIORITY_TONE[priority] ?? PRIORITY_TONE.Rendah)}
                      >
                        {LEARNING_PRIORITIES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-start-2 md:col-start-auto min-w-0">
                      <NotesCell key={`${item.id}-${item.notes}`} item={item} />
                    </div>

                    <div className="col-start-2 md:col-start-auto flex md:justify-end">
                      <button
                        type="button"
                        disabled={busy || duplicates.length > 0}
                        title={duplicates.length > 0 ? "Tinjau salinan lama dulu" : "Hapus target"}
                        aria-label={`Hapus target ${item.skillName}`}
                        onClick={async () => {
                          if (await confirmAction(`Hapus target ${item.skillName} beserta catatannya?`)) {
                            await run(item.id, () => learning.remove(item.id));
                          }
                        }}
                        className="inline-flex items-center gap-1 p-1.5 rounded-lg text-xs text-sb-text-2 hover:text-sb-critical hover:bg-sb-critical/10 disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="md:sr-only">Hapus</span>
                      </button>
                    </div>
                  </div>

                  {duplicates.length > 0 && (
                    <details className="mx-4 mb-3 rounded-xl border border-sb-border bg-white/60 p-3">
                      <summary className="cursor-pointer text-xs text-sb-text-2">
                        Tinjau {duplicates.length} salinan lama {item.skillName}
                      </summary>
                      <p className="text-xs text-sb-text-2 my-3">Catatan dan progres salinan tetap disimpan. Salin yang perlu sebelum menghapus salinan.</p>
                      <div className="space-y-3">
                        {duplicates.map((it) => (
                          <LearningItemEditor key={it.id} item={it} />
                        ))}
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
