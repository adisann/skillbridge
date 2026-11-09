import { Check, FileText, BookmarkCheck, Briefcase } from "lucide-react";
import { UI_COPY } from "@/lib/copy";
import { SkillChips } from "@/components/ui/skill-chips";
export function LandingHowItWorks() {
 const c=UI_COPY.landing;
 const steps=[{number:c.howItWorksStep1Number,title:c.howItWorksStep1Title,desc:c.howItWorksStep1Desc,Icon:FileText},{number:c.howItWorksStep2Number,title:c.howItWorksStep2Title,desc:c.howItWorksStep2Desc,Icon:Briefcase},{number:c.howItWorksStep3Number,title:c.howItWorksStep3Title,desc:c.howItWorksStep3Desc,Icon:BookmarkCheck}];
 return <section className="py-20 sm:py-28 bg-white"><div className="mx-auto max-w-[1380px] px-6 sm:px-12 lg:px-20 xl:px-24 space-y-12"><h2 className="max-w-2xl text-3xl sm:text-4xl font-extrabold tracking-tight text-sb-navy">{c.howItWorksTitle}</h2><div className="grid md:grid-cols-3 gap-6 sm:gap-8">{steps.map((step,i)=><article key={step.number} className="rounded-2xl border border-sb-border p-6 sm:p-7 flex flex-col gap-6">
  <div className="space-y-3"><span className="w-9 h-9 rounded-full bg-sb-mist-soft text-sb-navy font-bold text-sm flex items-center justify-center">{step.number}</span><h3 className="text-lg font-semibold text-sb-navy">{step.title}</h3><p className="text-[15px] leading-relaxed text-sb-text-2">{step.desc}</p></div>
  <div className="mt-auto p-4 rounded-xl bg-sb-mist-faint border border-sb-border space-y-3 min-h-40"><p className="text-xs text-sb-blue">{c.sceneExample}</p><div className="flex gap-2 items-center text-sm font-bold"><step.Icon className="w-4 h-4 text-sb-blue"/>{i===0?c.sceneCvRead:i===1?c.sceneRole:c.sceneLearning}</div>
  {i===0?<SkillChips skills={[...c.sceneSkills.slice(0,2)]} gapClass="gap-2" chipClass="border-sb-border bg-white text-sb-navy"/>:i===1?<><div className="flex gap-1 items-center text-xs text-sb-good"><Check className="w-4 h-4"/>{c.sceneSkills[0]} · {c.sceneFound}</div><SkillChips skills={[`${c.sceneGap} · ${c.sceneMissing}`]} variant="missing" gapClass="gap-1" chipClass=""/></>:<><div className="flex items-center gap-2 text-xs"><Check className="w-4 h-4 rounded bg-sb-good-soft text-sb-good"/>{c.sceneSkills[0]}</div><div className="flex items-center gap-2 text-xs"><span className="w-4 h-4 border border-sb-blue rounded"/>{c.sceneCourse}</div></>}
  </div></article>)}</div></div></section>;
}
