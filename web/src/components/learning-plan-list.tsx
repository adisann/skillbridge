"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useLearning } from "@/context/learning-context";
import { LEARNING_PRIORITIES, displayLearningPriority, noteSegments, type LearningItem } from "@/lib/learning";
import { LearningItemEditor } from "@/components/learning-item-editor";
import { Button } from "@/components/ui/button";
import { confirmAction } from "@/lib/dialogs";
import { cn } from "@/lib/utils";
import { useCareer } from "@/context/career-context";
import { careerTargetFilter } from "@/lib/job-categories";
import { getCanonicalSkill } from "@/lib/matching-config";
import { fetchDeduped } from "@/lib/fetcher";

interface SkillDemand {
  /** Jumlah lowongan sesuai target karier (N). */
  total: number;
  /** Jumlah lowongan yang meminta skill, per nama skill kanonik. */
  counts: Map<string, number>;
}

/** Permintaan tiap skill di lowongan yang sesuai target karier pengguna (sumber angka sama dengan Tren Skill). */
function useSkillDemand(targetRole: string | null | undefined): SkillDemand | null {
  const [demand, setDemand] = useState<{ key: string; value: SkillDemand } | null>(null);
  const role = careerTargetFilter(targetRole);
  useEffect(() => {
    let live = true;
    fetchDeduped<{ sampleSizeN: number; topSkills: Array<{ skillName: string; frequencyCount: number }> }>(
      `/api/insights?role=${encodeURIComponent(role)}&allSkills=1`
    )
      .then((data) => {
        if (!live) return;
        const counts = new Map<string, number>();
        for (const s of data.topSkills || []) counts.set(getCanonicalSkill(s.skillName), s.frequencyCount);
        setDemand({ key: role, value: { total: data.sampleSizeN || 0, counts } });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [role]);
  return demand?.key === role ? demand.value : null;
}

function DemandText({ skillName, demand }: { skillName: string; demand: SkillDemand | null }) {
  if (!demand) return null;
  const count = demand.counts.get(getCanonicalSkill(skillName)) ?? 0;
  return (
    <span className="block text-xs text-sb-text-2">
      Diminta di <strong className="font-semibold text-sb-navy">{count}</strong> dari {demand.total} lowongan target
    </span>
  );
}

type StatusFilter = "all" | "todo" | "done";
type SortMode = "custom" | "priority" | "trend";

const PRIORITY_TONE: Record<string, string> = {
  Tinggi: "bg-sb-critical/10 text-sb-critical border-sb-critical/25",
  Sedang: "bg-sb-warning/10 text-sb-warning border-sb-warning/25",
  Rendah: "bg-sb-mist-soft text-sb-navy border-sb-border",
};

function PrioritySelect({ skillName, value, disabled, className, onChange }: {
  skillName: string;
  value: string;
  disabled: boolean;
  className: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={`Prioritas ${skillName}`}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn("rounded-full border font-semibold focus:outline-none focus:ring-2 focus:ring-sb-blue", PRIORITY_TONE[value] ?? PRIORITY_TONE.Rendah, className)}
    >
      {LEARNING_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
    </select>
  );
}

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

function NotesCell({ item, autoEdit = false, onDone }: { item: LearningItem; autoEdit?: boolean; onDone?: () => void }) {
  const learning = useLearning();
  const [editing, setEditingState] = useState(autoEdit);
  const setEditing = (value: boolean) => {
    setEditingState(value);
    if (!value) onDone?.();
  };
  const [notes, setNotes] = useState(item.notes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (editing) {
    return (
      <div className="space-y-stack-xs">
        <textarea
          autoFocus
          aria-label={`Catatan ${item.skillName}`}
          className="w-full min-h-24 rounded-xl border border-sb-border p-stack-xs text-sm text-sb-navy focus:outline-none focus:ring-2 focus:ring-sb-blue"
          maxLength={20000}
          value={notes}
          disabled={busy}
          placeholder="Tautan kursus, video, atau materi yang ingin dilanjutkan…"
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex items-center gap-stack-xs">
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
        className="hidden lg:inline-flex items-center gap-stack-2xs text-xs font-semibold text-sb-blue hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        Tambah catatan
      </button>
    );
  }

  return (
    <div className="group/notes flex items-start gap-stack-xs min-w-0">
      <p className="min-w-0 text-xs lg:text-sm text-sb-navy whitespace-pre-wrap break-words line-clamp-1 lg:line-clamp-3">
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
        className="p-stack-2xs rounded-lg text-sb-text-2 hover:text-sb-navy hover:bg-sb-mist-faint shrink-0"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function LearningPlanList({ userKey }: { userKey: string }) {
  const learning = useLearning();
  const career = useCareer();
  const demand = useSkillDemand(career.targetRole);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("custom");
  const [order, saveOrder] = useCustomOrder(userKey);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [rowError, setRowError] = useState("");
  const [busyIds, setBusyIds] = useState<string[]>([]);
  // Khusus HP & tablet: menu ⋯ per baris, catatan yang sedang dibuka dari menu, dan grup "Sudah dipelajari"
  const [menuId, setMenuId] = useState<string | null>(null);
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  // Drag hanya boleh dimulai dari pegangan, supaya teks & kontrol di baris tetap bisa dipakai
  const handleArmed = useRef<string | null>(null);

  const items = learning.items.filter((it) => !it.duplicateOf);

  // Item baru (belum ada di urutan) tampil paling atas, sisanya mengikuti urutan manual
  const ordered = useMemo(() => {
    const position = new Map(order.map((id, i) => [id, i]));
    const list = [...items];
    if (sortMode === "trend") {
      // Paling banyak diminta di lowongan sesuai target karier lebih dulu (angka sama dengan Tren Skill)
      const count = (name: string) => demand?.counts.get(getCanonicalSkill(name)) ?? 0;
      return list.sort((a, b) => count(b.skillName) - count(a.skillName) || a.skillName.localeCompare(b.skillName));
    }
    if (sortMode === "priority") {
      const rank = (p: string) => LEARNING_PRIORITIES.indexOf(displayLearningPriority(p) as (typeof LEARNING_PRIORITIES)[number]);
      return list.sort((a, b) => rank(a.priority) - rank(b.priority) || Number(a.isDone) - Number(b.isDone) || a.skillName.localeCompare(b.skillName));
    }
    return list.sort((a, b) => (position.get(a.id) ?? -1) - (position.get(b.id) ?? -1));
  }, [items, order, sortMode, demand]);

  const visible = ordered.filter(
    (it) =>
      (status === "all" || (status === "done" ? it.isDone : !it.isDone)) &&
      (priorityFilter === "all" || displayLearningPriority(it.priority) === priorityFilter)
  );
  // Saat "Semua": yang belum dipelajari di atas, yang sudah dipelajari dikelompokkan di bawah
  const todoItems = status === "all" ? visible.filter((it) => !it.isDone) : visible;
  const doneItems = status === "all" ? visible.filter((it) => it.isDone) : [];
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
    const visibleIds = [...todoItems, ...doneItems].map((it) => it.id);
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

  const renderRow = (item: LearningItem, index: number, list: LearningItem[]) => {
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
                    "group/row border-t border-sb-border first:border-t-0 transition-colors hover:bg-sb-mist-faint/60",
                    dragId === item.id && "opacity-50",
                    overId === item.id && dragId !== item.id && "bg-sb-mist-faint shadow-[inset_0_2px_0_0_var(--sb-blue)]"
                  )}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_8rem_minmax(0,2fr)_7rem] gap-x-stack-xs lg:gap-x-stack-sm gap-y-stack-2xs lg:gap-y-stack-xs items-start px-stack-sm lg:px-stack-md py-stack-xs lg:py-stack-sm">
                    <div className="min-w-0">
                      {/* Pegangan seret dan centang selalu sebaris (HP & desktop); di HP prioritas dan menu ikut di baris ini */}
                      <div className="flex items-center lg:items-start gap-stack-xs">
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
                        className={cn("shrink-0 lg:mt-stack-3xs text-sb-text-2", canReorder ? "cursor-grab active:cursor-grabbing hover:text-sb-navy" : "opacity-30")}
                        title={canReorder ? "Seret untuk mengubah urutan" : undefined}
                      >
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-stack-xs lg:items-start">
                        <input
                          type="checkbox"
                          className="size-6 shrink-0 cursor-pointer accent-sb-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sb-blue disabled:cursor-default lg:mt-stack-3xs lg:size-4"
                          checked={item.isDone}
                          disabled={busy}
                          onChange={(e) => void run(item.id, () => learning.update(item.id, { isDone: e.target.checked }))}
                          aria-label={`Tandai ${item.skillName} sudah dipelajari`}
                        />
                        <span className="min-w-0">
                          <span className={cn("block text-sm font-bold text-sb-navy break-words", item.isDone && "line-through text-sb-text-2")}>{item.skillName}</span>
                          <span className="hidden lg:block mt-stack-3xs"><DemandText skillName={item.skillName} demand={demand} /></span>
                        </span>
                      </div>
                      {/* HP & tablet: prioritas dan menu ⋯ di kanan nama skill, supaya satu item cukup 2–3 baris */}
                      <div className="lg:hidden flex items-center gap-stack-2xs shrink-0">
                        <PrioritySelect
                          skillName={item.skillName}
                          value={priority}
                          disabled={busy}
                          onChange={(priority) => void run(item.id, () => learning.update(item.id, { priority }))}
                          className="h-7 pl-stack-xs pr-stack-2xs text-[11px]"
                        />
                        <div className="relative">
                          <button
                            type="button"
                            aria-label={`Aksi lain untuk ${item.skillName}`}
                            aria-expanded={menuId === item.id}
                            onClick={() => setMenuId(menuId === item.id ? null : item.id)}
                            className="p-stack-2xs rounded-lg text-sb-text-2 hover:text-sb-navy hover:bg-sb-mist-faint"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {menuId === item.id && (
                            <>
                              <button type="button" aria-label="Tutup menu" className="fixed inset-0 z-30 cursor-default" onClick={() => setMenuId(null)} />
                              <div role="menu" className="absolute right-0 top-full mt-stack-2xs z-40 w-48 rounded-xl border border-sb-border bg-white shadow-lg p-stack-2xs text-sm">
                                <button type="button" role="menuitem" className="w-full flex items-center gap-stack-xs px-stack-sm py-stack-xs rounded-lg hover:bg-sb-mist-faint text-left" onClick={() => { setNoteEditId(item.id); setMenuId(null); }}>
                                  <Pencil className="w-3.5 h-3.5 text-sb-blue" />{item.notes ? "Ubah catatan" : "Tambah catatan"}
                                </button>
                                {canReorder && (
                                  <>
                                    <button type="button" role="menuitem" disabled={index === 0} className="w-full flex items-center gap-stack-xs px-stack-sm py-stack-xs rounded-lg hover:bg-sb-mist-faint text-left disabled:opacity-40" onClick={() => { moveBy(item.id, -1); setMenuId(null); }}>
                                      <ArrowUp className="w-3.5 h-3.5 text-sb-blue" />Pindah ke atas
                                    </button>
                                    <button type="button" role="menuitem" disabled={index === list.length - 1} className="w-full flex items-center gap-stack-xs px-stack-sm py-stack-xs rounded-lg hover:bg-sb-mist-faint text-left disabled:opacity-40" onClick={() => { moveBy(item.id, 1); setMenuId(null); }}>
                                      <ArrowDown className="w-3.5 h-3.5 text-sb-blue" />Pindah ke bawah
                                    </button>
                                  </>
                                )}
                                {item.sourceJobId && (
                                  <Link role="menuitem" href={`/jobs/${item.sourceJobId}`} className="w-full flex items-center gap-stack-xs px-stack-sm py-stack-xs rounded-lg hover:bg-sb-mist-faint" onClick={() => setMenuId(null)}>
                                    <ExternalLink className="w-3.5 h-3.5 text-sb-blue" />Lowongan asal
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  role="menuitem"
                                  disabled={busy || duplicates.length > 0}
                                  className="w-full flex items-center gap-stack-xs px-stack-sm py-stack-xs rounded-lg text-sb-critical hover:bg-sb-critical/10 text-left disabled:opacity-40"
                                  onClick={async () => {
                                    setMenuId(null);
                                    if (await confirmAction(`Hapus target ${item.skillName} beserta catatannya?`)) {
                                      await run(item.id, () => learning.remove(item.id));
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />Hapus
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      </div>
                      {/* HP & tablet: permintaan skill di baris kedua (di luar baris atas), rata dengan nama skill */}
                      <div className="ml-14 mt-stack-3xs lg:hidden"><DemandText skillName={item.skillName} demand={demand} /></div>
                    </div>

                    <div className="hidden lg:block">
                      <PrioritySelect
                        skillName={item.skillName}
                        value={priority}
                        disabled={busy}
                        onChange={(priority) => void run(item.id, () => learning.update(item.id, { priority }))}
                        className="h-8 px-stack-sm text-xs"
                      />
                    </div>

                    <div className={cn("ml-14 min-w-0 lg:col-start-auto lg:ml-0", !item.notes && noteEditId !== item.id && "hidden lg:block")}>
                      <NotesCell
                        key={`${item.id}-${item.notes}-${noteEditId === item.id}`}
                        item={item}
                        autoEdit={noteEditId === item.id}
                        onDone={() => setNoteEditId((id) => (id === item.id ? null : id))}
                      />
                    </div>

                    <div className="hidden lg:flex lg:justify-end items-center gap-stack-3xs">
                      {canReorder && (
                        <>
                          <button type="button" aria-label={`Pindahkan ${item.skillName} ke atas`} title="Pindah ke atas" disabled={index === 0} onClick={() => moveBy(item.id, -1)} className="p-stack-2xs rounded-lg text-sb-blue hover:bg-sb-mist-faint disabled:opacity-25 disabled:hover:bg-transparent">
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button type="button" aria-label={`Pindahkan ${item.skillName} ke bawah`} title="Pindah ke bawah" disabled={index === list.length - 1} onClick={() => moveBy(item.id, 1)} className="p-stack-2xs rounded-lg text-sb-blue hover:bg-sb-mist-faint disabled:opacity-25 disabled:hover:bg-transparent">
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </>
                      )}
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
                        className="inline-flex items-center gap-stack-2xs p-stack-2xs rounded-lg text-xs text-sb-text-2 hover:text-sb-critical hover:bg-sb-critical/10 disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="lg:sr-only">Hapus</span>
                      </button>
                    </div>
                  </div>

                  {duplicates.length > 0 && (
                    <details className="mx-stack-md mb-stack-sm rounded-xl border border-sb-border bg-white/60 p-stack-sm">
                      <summary className="cursor-pointer text-xs text-sb-text-2">
                        Tinjau {duplicates.length} salinan lama {item.skillName}
                      </summary>
                      <p className="text-xs text-sb-text-2 my-stack-sm">Catatan dan progres salinan tetap disimpan. Salin yang perlu sebelum menghapus salinan.</p>
                      <div className="space-y-stack-sm">
                        {duplicates.map((it) => (
                          <LearningItemEditor key={it.id} item={it} />
                        ))}
                      </div>
                    </details>
                  )}
                </li>
    );
  };

  return (
    <div className="space-y-stack-sm">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-stack-sm">
        <div role="group" aria-label="Filter status belajar" className="grid w-full min-w-0 grid-cols-3 gap-stack-2xs rounded-xl border border-sb-border bg-white p-stack-2xs sm:w-auto sm:self-start">
          {([
            ["all", "Semua", "Semua"],
            ["todo", "Belum dipelajari", "Belum"],
            ["done", "Selesai dipelajari", "Selesai"],
          ] as const).map(([value, label, shortLabel]) => (
            <button
              key={value}
              type="button"
              aria-label={`${label} (${counts[value]})`}
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
              className={cn(
                "flex min-h-11 min-w-0 flex-col items-center justify-center rounded-lg px-stack-2xs py-stack-2xs text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-sb-blue sm:flex-row sm:gap-stack-2xs sm:px-stack-sm",
                status === value ? "bg-sb-sky text-sb-navy" : "text-sb-text-2 hover:text-sb-navy"
              )}
            >
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
              <span className="font-mono-metric text-[11px]">{counts[value]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-stack-sm">
          <label className="flex items-center gap-stack-xs text-xs font-semibold text-sb-navy">
            Prioritas
            <select
              className="h-9 rounded-lg border border-sb-border bg-white px-stack-xs text-xs"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">Semua</option>
              {LEARNING_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-stack-xs text-xs font-semibold text-sb-navy">
            Urutkan
            <select
              className="h-9 rounded-lg border border-sb-border bg-white px-stack-xs text-xs"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              <option value="custom">Urutan saya</option>
              <option value="priority">Prioritas tertinggi dulu</option>
              <option value="trend">Berdasarkan Tren Skill</option>
            </select>
          </label>
        </div>
      </div>

      <p className="hidden lg:block text-xs text-sb-text-2">
        {canReorder
          ? "Seret pegangan ⋮⋮ di kiri nama skill, atau pakai tombol panah di kolom Aksi, untuk mengatur urutan belajar."
          : "Pilih “Urutan saya” untuk mengatur urutan dengan menyeret."}
      </p>

      {rowError && <p role="alert" className="text-xs text-sb-critical">{rowError}</p>}

      <div className="rounded-2xl border border-sb-border bg-white/80 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[minmax(0,1.4fr)_8rem_minmax(0,2fr)_7rem] gap-stack-sm px-stack-md py-stack-xs border-b border-sb-border bg-white/70 text-[11px] font-bold uppercase tracking-wider text-sb-text-2">
          <span>Skill</span>
          <span>Prioritas</span>
          <span>Catatan</span>
          <span className="text-right">Aksi</span>
        </div>

        {visible.length === 0 ? (
          <p className="px-stack-md py-stack-2xl text-center text-sm text-sb-text-2">Tidak ada target belajar untuk filter ini.</p>
        ) : (
          <>
            {todoItems.length > 0 && <ul>{todoItems.map((item, index) => renderRow(item, index, todoItems))}</ul>}
            {doneItems.length > 0 && (
              <div className="border-t border-sb-border">
                {/* HP & tablet: grup "Sudah dipelajari" bisa dilipat; desktop: selalu tampil */}
                {/* Desktop: label kelompok (tidak bisa dilipat) */}
                <p className="hidden lg:block px-stack-md py-stack-xs text-[11px] font-bold uppercase tracking-wider text-sb-text-2 bg-sb-mist-faint border-b border-sb-border">
                  Sudah dipelajari ({doneItems.length})
                </p>
                <button
                  type="button"
                  onClick={() => setShowDone((v) => !v)}
                  aria-expanded={showDone}
                  className="lg:hidden w-full flex items-center justify-between px-stack-sm py-stack-xs text-xs font-semibold text-sb-navy bg-sb-mist-faint"
                >
                  <span>Sudah dipelajari ({doneItems.length})</span>
                  <ChevronDown className={cn("w-4 h-4 text-sb-text-2 transition-transform", showDone && "rotate-180")} />
                </button>
                <ul className={showDone ? "block" : "hidden lg:block"}>
                  {doneItems.map((item, index) => renderRow(item, index, doneItems))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
