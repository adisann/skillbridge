import { Files, HelpCircle, MailX } from "lucide-react";
import { UI_COPY } from "@/lib/copy";

export function LandingProblem() {
  const cards = [
    {
      icon: Files,
      title: UI_COPY.landing.problemCard1Title,
      desc: UI_COPY.landing.problemCard1Desc,
    },
    {
      icon: HelpCircle,
      title: UI_COPY.landing.problemCard2Title,
      desc: UI_COPY.landing.problemCard2Desc,
    },
    {
      icon: MailX,
      title: UI_COPY.landing.problemCard3Title,
      desc: UI_COPY.landing.problemCard3Desc,
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-[1380px] px-6 sm:px-12 lg:px-20 xl:px-24 space-y-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-sb-navy">
            {UI_COPY.landing.problemTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-2xl border border-sb-border bg-white space-y-4 shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-sb-mist-soft flex items-center justify-center text-sb-navy">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-sb-navy">{card.title}</h3>
                  <p className="text-[15px] leading-relaxed text-sb-text-2">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 text-center">
          <p className="text-sm sm:text-base font-semibold text-sb-blue">
            {UI_COPY.landing.problemPunchline}
          </p>
        </div>
      </div>
    </section>
  );
}
