"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, FileText, Pencil, Target, Trash2, X } from "lucide-react";
import { useCareer } from "@/context/career-context";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/job-categories";
import { clearDedupedCache, fetchDeduped } from "@/lib/fetcher";
import { confirmAction } from "@/lib/dialogs";
import { cn } from "@/lib/utils";

// Contoh posisi di data bidang ada yang terlalu singkat untuk dipakai sebagai target karier
const ROLE_LABEL: Record<string, string> = {
  Frontend: "Frontend Developer",
  "Full Stack": "Full Stack Developer",
  Backend: "Backend Developer",
  "Digital Marketing": "Digital Marketing Specialist",
  SEO: "SEO Specialist",
  Content: "Content Writer",
  "Cyber Security": "Cyber Security Analyst",
  PPIC: "PPIC Staff",
  Logistics: "Logistics Staff",
};

/** Saran target: nama bidang (sama seperti filter lowongan) dan contoh posisi di tiap bidang. */
function buildTargetGroups(saved: string[]) {
  const groups = JOB_CATEGORIES.filter((c) => c.slug !== "lainnya").map((c) => ({
    label: c.label,
    options: [c.label, ...c.examples.split(",").map((e) => e.trim()).filter(Boolean).map((e) => ROLE_LABEL[e] ?? e)],
  }));
  const known = new Set(groups.flatMap((g) => g.options.map((o) => o.toLowerCase())));
  const custom = saved.filter((t) => t && !known.has(t.toLowerCase()));
  return custom.length ? [{ label: "Target yang pernah kamu isi", options: custom }, ...groups] : groups;
}

function TargetCombobox({
  value,
  saved,
  disabled,
  onApply,
}: {
  value: string;
  saved: string[];
  disabled: boolean;
  onApply: (target: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [previousValue, setPreviousValue] = useState(value);
  if (previousValue !== value) {
    setPreviousValue(value);
    setQuery(value);
  }
  const groups = useMemo(() => buildTargetGroups(saved), [saved]);
  const q = query.trim().toLowerCase();
  const filtered = groups
    .map((g) => ({ ...g, options: g.options.filter((o) => !q || o.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) }))
    .filter((g) => g.options.length > 0);
  const trimmed = query.trim();
  const isExact = groups.some((g) => g.options.some((o) => o.toLowerCase() === trimmed.toLowerCase()));
  const canApply = !!trimmed && trimmed !== value && !disabled;

  const pick = (target: string) => {
    setQuery(target);
    setOpen(false);
    if (target !== value) onApply(target);
  };

  return (
    <div className="relative">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (canApply) pick(trimmed);
        }}
      >
        <div className="relative flex-1 min-w-0">
          <input
            role="combobox"
            aria-expanded={open}
            aria-controls="career-target-options"
            aria-label="Target karier"
            className="w-full h-10 rounded-xl border border-sb-border bg-white pl-3 pr-9 text-sm text-sb-navy placeholder:text-sb-text-2/70 focus:outline-none focus:ring-2 focus:ring-sb-blue"
            value={query}
            maxLength={150}
            disabled={disabled}
            placeholder="Pilih bidang atau ketik posisi, cth. Data Scientist"
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label="Tampilkan pilihan target"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-sb-text-2"
            onMouseDown={(e) => {
              e.preventDefault();
              setOpen((o) => !o);
            }}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <Button type="submit" size="sm" className="h-10 shrink-0" disabled={!canApply}>
          Terapkan
        </Button>
      </form>

      {open && !disabled && (
        <div
          id="career-target-options"
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border border-sb-border bg-white shadow-lg p-1 text-sm"
        >
          {trimmed && !isExact && (
            <button
              type="button"
              role="option"
              aria-selected={false}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-sb-mist-faint text-sb-navy"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(trimmed);
              }}
            >
              Gunakan &ldquo;<strong>{trimmed}</strong>&rdquo;
            </button>
          )}
          {filtered.map((g) => (
            <div key={g.label} className="py-1">
              <p className="px-3 pt-1 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-sb-text-2">{g.label}</p>
              {g.options.map((o) => (
                <button
                  key={`${g.label}-${o}`}
                  type="button"
                  role="option"
                  aria-selected={o === value}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg hover:bg-sb-mist-faint",
                    o === value ? "font-semibold text-sb-blue" : "text-sb-navy"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(o);
                  }}
                >
                  {o}
                  {o === value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && !trimmed && <p className="px-3 py-2 text-sb-text-2">Ketik posisi yang kamu tuju.</p>}
        </div>
      )}
    </div>
  );
}

function ResumeRow({
  resume,
  disabled,
  onActivate,
  onChanged,
}: {
  resume: { id: string; filename: string; is_active: boolean };
  disabled: boolean;
  onActivate: () => void;
  onChanged: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(resume.filename);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const rename = async () => {
    const next = name.replace(/\s+/g, " ").trim();
    if (!next || next === resume.filename) {
      setEditing(false);
      setName(resume.filename);
      return;
    }
    setWorking(true);
    setError("");
    try {
      clearDedupedCache();
      await fetchDeduped("/api/cv/rename", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resume.id, filename: next }),
      });
      setEditing(false);
      onChanged("Nama CV diperbarui.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const remove = async () => {
    const ok = await confirmAction(`Hapus "${resume.filename}"?`, {
      text: resume.is_active
        ? "Ini CV aktif. Dokumen, hasil ekstraksi, dan hasil kecocokannya akan dihapus permanen."
        : "Dokumen, hasil ekstraksi, dan hasil kecocokannya akan dihapus permanen.",
    });
    if (!ok) return;
    setWorking(true);
    setError("");
    try {
      clearDedupedCache();
      await fetchDeduped("/api/cv/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resume.id }),
      });
      onChanged("CV dihapus.");
    } catch (e) {
      setError((e as Error).message);
      setWorking(false);
    }
  };

  return (
    <li className={cn("rounded-xl border px-3 py-2.5", resume.is_active ? "border-sb-blue/40 bg-sb-mist-faint" : "border-sb-border bg-white")}>
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-sb-blue shrink-0" />
        {editing ? (
          <form
            className="flex-1 min-w-0 flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              void rename();
            }}
          >
            <input
              ref={inputRef}
              autoFocus
              aria-label="Nama CV"
              className="flex-1 min-w-0 h-8 rounded-lg border border-sb-border px-2 text-sm text-sb-navy focus:outline-none focus:ring-2 focus:ring-sb-blue"
              value={name}
              maxLength={120}
              disabled={working}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditing(false);
                  setName(resume.filename);
                }
              }}
            />
            <button type="submit" aria-label="Simpan nama" disabled={working} className="p-1.5 rounded-lg text-sb-good hover:bg-white">
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Batal ganti nama"
              disabled={working}
              className="p-1.5 rounded-lg text-sb-text-2 hover:bg-white"
              onClick={() => {
                setEditing(false);
                setName(resume.filename);
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <>
            <span className="flex-1 min-w-0 truncate text-sm text-sb-navy" title={resume.filename}>
              {resume.filename}
            </span>
            {resume.is_active ? (
              <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-sb-blue border border-sb-blue/30">Aktif</span>
            ) : (
              <button
                type="button"
                disabled={disabled || working}
                onClick={onActivate}
                className="shrink-0 text-xs font-semibold text-sb-blue hover:underline disabled:opacity-50"
              >
                Aktifkan
              </button>
            )}
            <button
              type="button"
              aria-label={`Ganti nama ${resume.filename}`}
              title="Ganti nama"
              disabled={disabled || working}
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-sb-text-2 hover:text-sb-navy hover:bg-white disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Hapus ${resume.filename}`}
              title="Hapus"
              disabled={disabled || working}
              onClick={() => void remove()}
              className="p-1.5 rounded-lg text-sb-text-2 hover:text-sb-critical hover:bg-white disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-sb-critical">{error}</p>}
    </li>
  );
}

export function CareerContextBar({ beforeChange }: { beforeChange?: () => boolean | Promise<boolean> }) {
  const career = useCareer();
  const [notice, setNotice] = useState("");
  const change = async (patch: { resumeId?: string; targetRole?: string }) => {
    if (!beforeChange || await beforeChange()) return career.change(patch);
  };
  const savedTargets = Array.from(new Set([...career.targetRoles, career.targetRole].filter(Boolean)));

  return (
    <details className="group rounded-2xl border border-sb-border bg-white/80 text-sm text-sb-navy">
      <summary className="list-none cursor-pointer flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-1.5 min-w-0">
          <FileText className="w-4 h-4 text-sb-blue shrink-0" />
          <span className="text-sb-text-2">CV aktif:</span>
          <strong className="truncate max-w-[16rem]">{career.activeResume?.filename || "Belum dipilih"}</strong>
        </span>
        <span className="flex items-center gap-1.5 min-w-0">
          <Target className="w-4 h-4 text-sb-blue shrink-0" />
          <span className="text-sb-text-2">Target karier:</span>
          <strong className="truncate max-w-[16rem]">{career.targetRole || "Belum dipilih"}</strong>
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-sb-blue">
          <span className="group-open:hidden">Ubah CV / target</span>
          <span className="hidden group-open:inline">Tutup</span>
          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        </span>
      </summary>

      <section aria-label="CV dan target karier" className="grid grid-cols-1 lg:grid-cols-2 gap-5 border-t border-sb-border px-4 py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">CV tersimpan</h3>
            <Link href="/cv#upload" className="text-xs font-semibold text-sb-blue hover:underline">
              Unggah CV baru
            </Link>
          </div>
          {career.resumes.length === 0 ? (
            <p className="text-xs text-sb-text-2">Belum ada CV. Unggah CV untuk melihat kecocokan dengan lowongan.</p>
          ) : (
            <ul className="space-y-1.5">
              {career.resumes.map((r) => (
                <ResumeRow
                  key={`${r.id}-${r.filename}`}
                  resume={r}
                  disabled={career.busy}
                  onActivate={() => void change({ resumeId: r.id })}
                  onChanged={(message) => {
                    setNotice(message);
                    void career.refresh();
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Target karier</h3>
          <TargetCombobox
            value={career.targetRole}
            saved={savedTargets}
            disabled={career.busy}
            onApply={(target) => void change({ targetRole: target })}
          />
          <p className="text-xs text-sb-text-2">
            Pilih bidang seperti di filter lowongan, atau ketik posisi sendiri. Kecocokan, tren skill, dan urutan lowongan
            mengikuti target ini.
          </p>
        </div>

        {(notice || career.error) && (
          <p role={career.error ? "alert" : "status"} className={cn("lg:col-span-2 text-xs", career.error ? "text-sb-critical" : "text-sb-good")}>
            {career.error || notice}
          </p>
        )}
      </section>
    </details>
  );
}
