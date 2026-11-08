"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLearning } from "@/context/learning-context";

export function LearningButton({ skillName, reason, priority, sourceJobId }: { skillName: string; reason?: string; priority?: string; sourceJobId?: string }) {
  const learning = useLearning();
  const [error, setError] = useState("");
  const added = !!learning.find(skillName);
  const pending = learning.isPending(skillName);
  return <div className="space-y-1 max-w-full">
    <Button type="button" variant="outline" size="sm" isLoading={pending} disabled={added || learning.isLoading || !!learning.loadError}
      className="!h-auto min-h-9 py-2 [&>span]:whitespace-normal text-left"
      onClick={async () => {
        setError("");
        try { await learning.add(skillName, reason, priority, sourceJobId); }
        catch (e) { setError((e as Error).message); }
      }}>{added ? "Sudah ditambahkan" : pending ? "Menambahkan…" : learning.isLoading ? "Memuat rencana…" : "Tambah ke rencana belajar"}</Button>
    {added && <Link href="/progress" className="block text-xs text-sb-blue underline">Buka rencana belajar</Link>}
    {(error || learning.loadError) && <div role="alert" className="text-xs text-sb-critical max-w-xs">{error || learning.loadError}{learning.loadError && <button type="button" className="underline ml-1" onClick={() => void learning.reload()}>Coba muat ulang</button>}</div>}
  </div>;
}
