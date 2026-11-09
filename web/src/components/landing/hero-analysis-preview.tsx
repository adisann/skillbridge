"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, FileText, BookOpen, ArrowRight, UploadCloud, Loader2 } from "lucide-react";
import { UI_COPY } from "@/lib/copy";
import { SkillChips } from "@/components/ui/skill-chips";
import { cn } from "@/lib/utils";

export function ExampleResultCard() {
  const c = UI_COPY.landing;
  return <div className="bg-white border border-sb-border rounded-2xl p-5 text-sb-navy space-y-3"><p className="text-xs font-semibold text-sb-blue">{c.sceneResult}</p><p className="font-bold">{c.sceneRole}</p><p className="text-sm">{c.sceneCount}</p><SkillChips skills={[`${c.sceneGap} · ${c.sceneMissing}`]} variant="missing" gapClass="gap-2" chipClass=""/></div>;
}

/*
 * Animasi hero berulang: unggah CV → CV dibaca → hasil analisis → jeda → ulang.
 * Render awal (SSR) langsung menampilkan hasil, jadi tanpa JS / dengan reduced-motion
 * pengunjung tetap melihat kartu hasil yang statis.
 */
type Phase = "idle" | "upload" | "process" | "result" | "out";

const DURATION: Record<Phase, number> = {
  idle: 1400, // jeda kosong sebelum loop berikutnya
  upload: 2100,
  process: 2900,
  result: 5200, // waktu baca hasil
  out: 450,
};

const NEXT: Record<Phase, Phase> = { idle: "upload", upload: "process", process: "result", result: "out", out: "idle" };

const STEP: Record<Phase, number> = { idle: 0, upload: 0, process: 1, result: 2, out: 2 };

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

function useDemoLoop() {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("result");
  const [cycle, setCycle] = useState(0);
  const [running, setRunning] = useState(false);

  // Hanya berjalan saat terlihat di layar, tab aktif, dan pengguna tidak meminta reduced motion.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = false;
    const sync = () => setRunning(onScreen && !document.hidden && !motion.matches);
    const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); }, { threshold: 0.25 });
    observer.observe(el);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      const next = NEXT[phase];
      if (next === "upload") setCycle((n) => n + 1);
      setPhase(next);
    }, DURATION[phase]);
    return () => window.clearTimeout(timer);
  }, [phase, running]);

  return { ref, phase, cycle, running };
}

export function HeroAnalysisPreview() {
  const c = UI_COPY.landing;
  const { ref, phase, cycle, running } = useDemoLoop();
  const showResult = phase === "result" || phase === "out";
  const title = phase === "process" ? c.demoProcessTitle : showResult ? c.previewTitle : c.demoUploadTitle;

  return (
    <div
      ref={ref}
      data-paused={running ? undefined : ""}
      className="hero-demo w-full rounded-3xl border border-sb-blue/20 bg-white shadow-[0_20px_60px_-24px_rgba(0,90,156,.3)] overflow-hidden text-sb-navy"
    >
      <p className="sr-only">{c.demoA11y}</p>
      <div aria-hidden="true">
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-sb-mist-faint border-b border-sb-border">
          <span key={title} className="flex items-center gap-2 text-sm font-bold animate-fade-in">
            <FileText className="w-4 h-4 text-sb-blue" />
            {title}
          </span>
          <span className="flex items-center gap-2.5">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn("h-1.5 rounded-full transition-all duration-300", i <= STEP[phase] ? "w-4 bg-sb-sky" : "w-1.5 bg-sb-mist")}
                />
              ))}
            </span>
            <span className="rounded-full border border-sb-border px-2.5 py-1 text-xs text-sb-blue bg-white">{c.sceneExample}</span>
          </span>
        </div>

        <div className="relative">
          {/* Hasil selalu ada di alur dokumen supaya tinggi kartu tidak berubah antar tahap. */}
          <ResultBody
            key={`result-${cycle}-${showResult}`}
            animate={cycle > 0}
            className={cn(!showResult && "invisible", phase === "out" && "hero-demo-out")}
          />
          {(phase === "idle" || phase === "upload") && <UploadStage key={`upload-${cycle}`} active={phase === "upload"} />}
          {phase === "process" && <ProcessStage key={`process-${cycle}`} />}
        </div>
      </div>
    </div>
  );
}

function UploadStage({ active }: { active: boolean }) {
  const c = UI_COPY.landing;
  return (
    <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-center gap-5 animate-fade-in">
      <div
        className={cn(
          "rounded-2xl border-2 border-dashed px-6 py-10 flex flex-col items-center text-center gap-2 transition-colors duration-300",
          active ? "border-sb-sky bg-sb-mist-faint" : "border-sb-border bg-white"
        )}
      >
        <span className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-sb-mist-soft text-sb-blue", !active && "hero-demo-bob")}>
          <UploadCloud className="w-6 h-6" />
        </span>
        <p className="text-sm font-bold mt-1">{c.demoDropHint}</p>
        <p className="text-xs text-sb-text-2">{c.demoDropFormats}</p>
      </div>

      <div className={cn("rounded-2xl border border-sb-border bg-white p-4 shadow-xs", active ? "hero-demo-drop" : "opacity-0")}>
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-sb-mist-soft flex items-center justify-center text-sb-blue shrink-0">
            <FileText className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">{c.demoFileName}</p>
            <div className="relative h-4 text-xs text-sb-text-2">
              <span className="absolute inset-0 hero-demo-swap-out" style={delay(1650)}>{c.demoFileSize} · {c.demoUploading}</span>
              <span className="absolute inset-0 flex items-center gap-1 text-sb-good font-semibold hero-demo-swap-in" style={delay(1650)}>
                <Check className="w-3.5 h-3.5" />
                {c.demoUploaded}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-sb-mist-soft overflow-hidden">
          <div className={cn("h-full rounded-full bg-sb-sky", active && "hero-demo-fill")} style={{ ...delay(350), ["--fill-dur" as string]: "1250ms" }} />
        </div>
      </div>
    </div>
  );
}

function ProcessStage() {
  const c = UI_COPY.landing;
  return (
    <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-center gap-6 animate-fade-in">
      <div className="flex items-center gap-5">
        {/* Dokumen mini yang dipindai */}
        <div className="relative w-24 h-32 shrink-0 rounded-xl border border-sb-border bg-white shadow-xs overflow-hidden p-3 space-y-2">
          <span className="block h-2 w-10 rounded-full bg-sb-mist" />
          {[100, 80, 92, 64, 88, 72, 56].map((w, i) => (
            <span key={i} className="block h-1.5 rounded-full bg-sb-mist-soft" style={{ width: `${w}%` }} />
          ))}
          <span className="hero-demo-scan absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent via-sb-sky/40 to-transparent" />
        </div>
        <div className="space-y-1.5 min-w-0">
          <p className="text-sm font-bold truncate">{c.demoFileName}</p>
          <p className="flex items-center gap-2 text-xs text-sb-text-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sb-blue" />
            {c.demoReading}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Check className="w-4 h-4 text-sb-good" />
          {c.sceneCvRead}
        </p>
        <div className="flex flex-wrap gap-2">
          {c.previewFound.map((skill, i) => (
            <span key={skill} className="px-3 py-1 rounded-full border text-xs font-semibold bg-sb-good-soft border-sb-good/20 text-sb-navy animate-pop-in" style={delay(450 + i * 380)}>
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2 hero-demo-rise" style={delay(2050)}>
        <p className="text-xs text-sb-text-2">{c.demoMatching}</p>
        <div className="h-1.5 rounded-full bg-sb-mist-soft overflow-hidden">
          <div className="h-full rounded-full bg-sb-sky hero-demo-fill" style={{ ...delay(2100), ["--fill-dur" as string]: "750ms" }} />
        </div>
      </div>
    </div>
  );
}

function ResultBody({ animate, className }: { animate: boolean; className?: string }) {
  const c = UI_COPY.landing;
  const rise = (ms: number, base?: string) => ({ className: cn(base, animate && "hero-demo-rise"), style: animate ? delay(ms) : undefined });
  return (
    <div className={cn("p-5 sm:p-7 space-y-6", className)}>
      <div {...rise(0)}>
        <p className="text-xs text-sb-text-2 mb-2">{c.previewRoleLabel}</p>
        <h2 className="text-2xl font-extrabold tracking-tight">{c.sceneRole}</h2>
        <p className="text-sm text-sb-text-2 mt-2">{c.sceneCount}</p>
        <div className="flex gap-1.5 mt-4">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="h-2 flex-1 rounded-full bg-sb-mist-soft overflow-hidden">
              {i < 4 && (
                <span
                  className={cn("block h-full rounded-full bg-sb-sky", animate && "hero-demo-fill")}
                  style={animate ? { ...delay(250 + i * 130), ["--fill-dur" as string]: "320ms" } : undefined}
                />
              )}
            </span>
          ))}
        </div>
      </div>
      <div {...rise(180, "space-y-3")}>
        <p className="flex items-center gap-2 text-sm font-bold"><Check className="w-4 h-4 text-sb-good" />{c.sceneFound}</p>
        <SkillChips skills={[...c.previewFound]} gapClass="gap-2" chipClass="bg-sb-good-soft border-sb-good/20 text-sb-navy" />
      </div>
      <div {...rise(360, "space-y-3")}>
        <p className="text-sm font-bold">{c.sceneMissing}</p>
        <SkillChips skills={[...c.previewMissing]} variant="missing" gapClass="gap-2" chipClass="" />
      </div>
      <div {...rise(560, "flex items-start gap-3 rounded-2xl bg-sb-mist-faint p-4 border border-sb-border")}>
        <BookOpen className="w-5 h-5 text-sb-blue shrink-0 mt-0.5" />
        <div className="space-y-1"><p className="font-bold text-sm">{c.previewNext}</p><p className="text-xs text-sb-text-2 leading-relaxed">{c.previewNextDesc}</p></div>
        <ArrowRight className="w-4 h-4 shrink-0 text-sb-blue mt-1" />
      </div>
    </div>
  );
}
