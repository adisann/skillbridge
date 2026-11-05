import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Callout ringkas di atas filter untuk pengunjung tanpa login. */
export function GuestCalloutBanner() {
  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-sb-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 shadow-2xs">
      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-bold text-sb-navy">
          Ingin membandingkan tren ini dengan skill di CV&#8209;mu?
        </p>
        <p className="text-xs text-sb-text-2">
          Masuk untuk melihat skill mana yang sudah ada di CV atau perlu kamu pelajari.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/login">
          <Button variant="outline" size="sm" className="text-xs">
            Masuk
          </Button>
        </Link>
      </div>
    </div>
  );
}

/** Kartu ajakan di bawah daftar skill untuk pengunjung tanpa login. */
export function GuestComparePrompt() {
  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-sb-border bg-sb-mist-soft space-y-3">
      <h3 className="text-base font-extrabold text-sb-navy">Ingin membandingkan tren skill di atas dengan CV-mu?</h3>
      <p className="text-xs sm:text-sm text-sb-text-2 leading-relaxed max-w-2xl">
        Masuk untuk memetakan otomatis skill yang sudah kamu miliki, melihat status kecocokan, dan menambahkan gap kompetensi langsung ke rencana belajar pribadimu.
      </p>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Link href="/login?next=/tren-skill">
          <Button variant="primary" size="md">
            Masuk
          </Button>
        </Link>
      </div>
    </div>
  );
}
