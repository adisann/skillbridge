"use client";

import React, { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { UI_COPY } from "@/lib/copy";

/**
 * Katalog layar aplikasi ala Mobbin: dua baris kartu tiruan layar SkillBridge
 * yang berjalan berlawanan arah (CSS marquee), berhenti saat di-hover atau di luar layar,
 * dan diam saat reduced-motion.
 * Murni dekoratif: tidak ada tautan atau aksi.
 */

const CARD = "w-[300px] sm:w-[340px] h-[220px] shrink-0 rounded-2xl bg-white border border-sb-border landing-card-shadow p-stack-md sm:p-stack-lg flex flex-col gap-stack-sm text-sb-navy";
const TITLE = "text-[15px] font-bold";
const CHIP_FOUND = "px-stack-xs py-stack-2xs rounded-full bg-sb-good-soft text-xs font-semibold";
const CHIP_MISSING = "px-stack-xs py-stack-2xs rounded-full border border-dashed border-sb-warning bg-sb-warning-soft text-xs font-semibold";

function ScoreRing({ value }: { value: number }) {
  const c = 2 * Math.PI * 26;
  return (
    <svg width="80" height="80" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="26" fill="none" stroke="var(--sb-mist-soft)" strokeWidth="8" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="var(--sb-sky)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" fontWeight="700" fontSize="14" fill="var(--sb-navy)">{value}%</text>
    </svg>
  );
}

function RowA() {
  const c = UI_COPY.landing;
  return (
    <>
      <div className={CARD}>
        <div className="flex items-center justify-between">
          <span className={TITLE}>{UI_COPY.nav.dashboard}</span>
          <span className="px-stack-xs py-stack-3xs rounded-full bg-sb-mist-soft text-[11px] font-bold">{c.sceneRole}</span>
        </div>
        <div className="flex items-center gap-stack-md">
          <ScoreRing value={68} />
          <div className="flex-1 space-y-stack-xs">
            <div className="h-2 w-[70%] rounded-full bg-sb-blue/55" />
            <div className="h-1.5 w-[90%] rounded-full bg-sb-mist" />
            <div className="h-1.5 w-[60%] rounded-full bg-sb-mist" />
          </div>
        </div>
        <div className="mt-auto grid grid-cols-3 gap-stack-xs font-bold">
          <span className="rounded-lg bg-sb-mist-faint border border-sb-border px-stack-xs py-stack-2xs">12</span>
          <span className="rounded-lg bg-sb-mist-faint border border-sb-border px-stack-xs py-stack-2xs">5</span>
          <span className="rounded-lg bg-sb-mist-faint border border-sb-border px-stack-xs py-stack-2xs">3</span>
        </div>
      </div>

      <div className={CARD}>
        <span className={TITLE}>{UI_COPY.nav.jobs}</span>
        {[
          ["Data Analyst", "Jakarta · Full-time", "82%", "bg-sb-good-soft text-sb-good"],
          ["BI Analyst", "Remote", "54%", "bg-sb-warning-soft text-sb-warning"],
        ].map(([title, meta, score, tone]) => (
          <div key={title} className="flex items-center justify-between gap-stack-sm rounded-xl border border-sb-border p-stack-sm">
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{title}</p>
              <p className="text-xs font-semibold text-sb-blue">{meta}</p>
            </div>
            <span className={`px-stack-xs py-stack-2xs rounded-full text-xs font-bold ${tone}`}>{score}</span>
          </div>
        ))}
      </div>

      <div className={CARD}>
        <span className={TITLE}>{UI_COPY.nav.insights}</span>
        <div className="grid grid-cols-[72px_1fr] items-center gap-x-stack-sm gap-y-stack-xs text-xs font-semibold">
          {[["SQL", 92, "bg-sb-sky"], ["Python", 74, "bg-sb-sky"], ["Excel", 61, "bg-sb-sky"], ["Power BI", 48, "bg-sb-mist"], ["Tableau", 36, "bg-sb-mist"]].map(([name, w, tone]) => (
            <React.Fragment key={name as string}>
              <span>{name}</span>
              <div className={`h-3 rounded-full ${tone}`} style={{ width: `${w}%` }} />
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className={CARD}>
        <span className={TITLE}>{UI_COPY.nav.cv}</span>
        <div className="flex items-center gap-stack-sm rounded-xl bg-sb-mist-faint border border-sb-border p-stack-xs">
          <span className="w-7 h-8 rounded-md bg-white border-[1.5px] border-sb-blue" />
          <span className="text-[13px] font-bold">{c.demoFileName}</span>
        </div>
        <div className="flex flex-wrap gap-stack-2xs">
          {["SQL", "Python", "Excel", "Statistics"].map((s) => <span key={s} className={CHIP_FOUND}>{s}</span>)}
        </div>
      </div>
    </>
  );
}

function RowB() {
  const c = UI_COPY.landing;
  return (
    <>
      <div className={`${CARD} sm:w-[380px]`}>
        <span className={TITLE}>{UI_COPY.nav.tracker}</span>
        <div className="grid grid-cols-3 gap-stack-xs flex-1">
          {[["Tersimpan", 2, false], ["Sudah Melamar", 1, true], ["Wawancara", 1, false]].map(([label, n, active]) => (
            <div key={label as string} className="rounded-xl bg-sb-mist-faint border border-sb-border p-stack-xs space-y-stack-2xs">
              <span className="block text-[11px] font-bold leading-tight">{label}</span>
              {Array.from({ length: n as number }).map((_, i) => (
                <div key={i} className={`h-8 rounded-lg bg-white border ${active ? "border-sb-sky border-[1.5px]" : "border-sb-border"}`} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={CARD}>
        <span className={TITLE}>{UI_COPY.nav.progress}</span>
        {[["SQL", "Tinggi", true], ["Power BI", "Tinggi", false], ["Tableau", "Sedang", false], ["BigQuery", "Rendah", false]].map(([skill, prio, done]) => (
          <div key={skill as string} className="flex items-center gap-stack-xs text-[13px] font-semibold">
            {done ? (
              <span className="w-4.5 h-4.5 rounded-md bg-sb-good flex items-center justify-center"><Check className="w-3 h-3 text-white" strokeWidth={3.5} /></span>
            ) : (
              <span className="w-4.5 h-4.5 rounded-md border-2 border-sb-blue" />
            )}
            <span className={done ? "line-through" : ""}>{skill}</span>
            <span className="ml-auto px-stack-xs py-stack-3xs rounded-full bg-sb-mist-soft text-[11px]">{prio}</span>
          </div>
        ))}
      </div>

      <div className={CARD}>
        <span className={TITLE}>Bandingkan lowongan</span>
        <div className="grid grid-cols-[76px_1fr_1fr] items-center gap-stack-xs text-xs">
          <span />
          <span className="font-bold">Data Analyst</span>
          <span className="font-bold">BI Analyst</span>
          <span className="font-semibold text-sb-blue">Kecocokan CV</span>
          <span className="font-bold text-sb-good">82%</span>
          <span className="font-bold text-sb-warning">54%</span>
        </div>
        <span className="mt-auto self-start px-stack-xs py-stack-2xs rounded-full bg-sb-good-soft text-sb-good text-xs font-bold">Paling cocok</span>
      </div>

      <div className={CARD}>
        <span className={TITLE}>{c.sceneRole}</span>
        <p className="text-xs font-bold text-sb-good">{c.sceneFound}</p>
        <div className="flex flex-wrap gap-stack-2xs">
          {["SQL", "Python"].map((s) => <span key={s} className={CHIP_FOUND}>{s}</span>)}
        </div>
        <p className="text-xs font-bold text-sb-warning">{c.sceneMissing}</p>
        <div className="flex flex-wrap gap-stack-2xs">
          {["Power BI", "Tableau"].map((s) => <span key={s} className={CHIP_MISSING}>{s}</span>)}
        </div>
      </div>
    </>
  );
}

export function LandingAppCatalog() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Hentikan animasi saat katalog tidak terlihat
    const io = new IntersectionObserver(([entry]) => {
      root.dataset.paused = entry.isIntersecting ? "false" : "true";
    });
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={rootRef}
      className="sb-catalog pb-stack-6xl sm:pb-stack-8xl overflow-hidden space-y-stack-lg"
      role="img"
      aria-label={UI_COPY.landing.catalogA11y}
    >
      <div aria-hidden="true">
        <div className="sb-catalog-track">
          <RowA />
          <RowA />
        </div>
      </div>
      <div aria-hidden="true">
        <div className="sb-catalog-track" data-reverse="true">
          <RowB />
          <RowB />
        </div>
      </div>
    </section>
  );
}
