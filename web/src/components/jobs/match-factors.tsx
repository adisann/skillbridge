import type { ReactNode } from "react";
import { CheckCircle2, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface FactorCardProps {
  title: string;
  icon: ReactNode;
  titleClass: string;
  bulletClass: string;
  items: string[];
}

function FactorCard({ title, icon, titleClass, bulletClass, items }: FactorCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={`${titleClass} flex items-center gap-2`}>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-sb-text-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`${bulletClass} font-bold`}>•</span>
            <span>{item}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface MatchFactorsProps {
  supporting: string[];
  limiting: string[];
}

/** Faktor pendukung dan faktor pembatas dari hasil match. */
export function MatchFactors({ supporting, limiting }: MatchFactorsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FactorCard
        title="Faktor Pendukung"
        icon={<CheckCircle2 className="w-4 h-4 text-sb-good" />}
        titleClass="text-sb-good"
        bulletClass="text-sb-good"
        items={supporting.length > 0 ? supporting : ["Memenuhi kualifikasi skill utama yang disyaratkan"]}
      />
      <FactorCard
        title="Faktor Pembatas & Gap"
        icon={<HelpCircle className="w-4 h-4 text-sb-warning" />}
        titleClass="text-sb-warning"
        bulletClass="text-sb-warning"
        items={limiting.length > 0 ? limiting : ["Seluruh kualifikasi wajib terpenuhi dengan baik"]}
      />
    </div>
  );
}
