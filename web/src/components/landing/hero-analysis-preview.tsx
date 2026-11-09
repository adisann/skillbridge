import { Check, FileText, BookOpen, ArrowRight } from "lucide-react";
import { UI_COPY } from "@/lib/copy";
import { SkillChips } from "@/components/ui/skill-chips";

export function ExampleResultCard() {
  const c = UI_COPY.landing;
  return <div className="bg-white border border-sb-border rounded-2xl p-5 text-sb-navy space-y-3"><p className="text-xs font-semibold text-sb-blue">{c.sceneResult}</p><p className="font-bold">{c.sceneRole}</p><p className="text-sm">{c.sceneCount}</p><SkillChips skills={[`${c.sceneGap} · ${c.sceneMissing}`]} variant="missing" gapClass="gap-2" chipClass=""/></div>;
}

export function HeroAnalysisPreview() {
  const c = UI_COPY.landing;
  return <div className="w-full rounded-3xl border border-sb-blue/20 bg-white shadow-[0_20px_60px_-24px_rgba(0,90,156,.3)] overflow-hidden text-sb-navy">
    <div className="flex items-center justify-between gap-3 px-5 py-4 bg-sb-mist-faint border-b border-sb-border"><span className="flex items-center gap-2 text-sm font-bold"><FileText className="w-4 h-4 text-sb-blue"/>{c.previewTitle}</span><span className="rounded-full border border-sb-border px-2.5 py-1 text-xs text-sb-blue bg-white">{c.sceneExample}</span></div>
    <div className="p-5 sm:p-7 space-y-6">
      <div><p className="text-xs text-sb-text-2 mb-2">{c.previewRoleLabel}</p><h2 className="text-2xl font-extrabold tracking-tight">{c.sceneRole}</h2><p className="text-sm text-sb-text-2 mt-2">{c.sceneCount}</p><div className="flex gap-1.5 mt-4" aria-hidden="true">{Array.from({length:8},(_,i)=><span key={i} className={`h-2 flex-1 rounded-full ${i<4 ? "bg-sb-sky" : "bg-sb-mist-soft"}`}/>)}</div></div>
      <div className="space-y-3"><p className="flex items-center gap-2 text-sm font-bold"><Check className="w-4 h-4 text-sb-good"/>{c.sceneFound}</p><SkillChips skills={[...c.previewFound]} gapClass="gap-2" chipClass="bg-sb-good-soft border-sb-good/20 text-sb-navy"/></div>
      <div className="space-y-3"><p className="text-sm font-bold">{c.sceneMissing}</p><SkillChips skills={[...c.previewMissing]} variant="missing" gapClass="gap-2" chipClass=""/></div>
      <div className="flex items-start gap-3 rounded-2xl bg-sb-mist-faint p-4 border border-sb-border"><BookOpen className="w-5 h-5 text-sb-blue shrink-0 mt-0.5"/><div className="space-y-1"><p className="font-bold text-sm">{c.previewNext}</p><p className="text-xs text-sb-text-2 leading-relaxed">{c.previewNextDesc}</p></div><ArrowRight className="w-4 h-4 shrink-0 text-sb-blue mt-1"/></div>
    </div>
  </div>;
}
