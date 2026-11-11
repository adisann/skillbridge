"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLearning } from "@/context/learning-context";

/** Gaya tombol kecil seukuran badge status (dipakai di baris Tren Skill). */
export const CHIP_BUTTON_CLASS =
  "inline-flex items-center gap-stack-2xs h-6 px-stack-xs rounded-full border text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:cursor-default";

export function LearningButton({ skillName, reason, priority, sourceJobId, size = "default" }: { skillName: string; reason?: string; priority?: string; sourceJobId?: string; size?: "default" | "chip" }) {
  const learning = useLearning();
  const [error, setError] = useState("");
  const added = !!learning.find(skillName);
  const pending = learning.isPending(skillName);
  const add = async () => {
    setError("");
    try { await learning.add(skillName, reason, priority, sourceJobId); }
    catch (e) { setError((e as Error).message); }
  };
  if (size === "chip") {
    return <span className="inline-flex flex-wrap items-center gap-stack-xs">
      {!added && <button type="button" onClick={add} disabled={pending || learning.isLoading || !!learning.loadError}
        className={`${CHIP_BUTTON_CLASS} bg-white text-sb-blue border-sb-blue/40 hover:bg-sb-mist-faint`}>
        {pending ? "Menambahkan…" : learning.isLoading ? "Memuat…" : "Tambah ke rencana belajar"}
      </button>}
      {added && <Link href="/progress" className="text-[11px] font-semibold text-sb-blue underline whitespace-nowrap">Buka rencana belajar</Link>}
      {(error || learning.loadError) && <span role="alert" className="text-[11px] text-sb-critical">{error || learning.loadError}</span>}
    </span>;
  }
  return <div className="space-y-stack-2xs max-w-full">
    {!added && <Button type="button" variant="outline" size="sm" isLoading={pending} disabled={learning.isLoading || !!learning.loadError}
      className="!h-auto min-h-9 py-stack-xs [&>span]:whitespace-normal text-left"
      onClick={add}>{pending ? "Menambahkan…" : learning.isLoading ? "Memuat rencana…" : "Tambah ke rencana belajar"}</Button>}
    {added && <Link href="/progress" className="block text-xs text-sb-blue underline">Buka rencana belajar</Link>}
    {(error || learning.loadError) && <div role="alert" className="text-xs text-sb-critical max-w-xs">{error || learning.loadError}{learning.loadError && <button type="button" className="underline ml-stack-2xs" onClick={() => void learning.reload()}>Coba muat ulang</button>}</div>}
  </div>;
}
