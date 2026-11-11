"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { clearDedupedCache, fetchDeduped } from "@/lib/fetcher";

interface CareerData {
  resumes: { id: string; filename: string; is_active: boolean }[];
  targetRole: string;
  targetRoles: string[];
}
function useCareerState() {
  const { user, updateUserTargetRole } = useAuth();
  const [data, setData] = useState<CareerData>({ resumes: [], targetRole: "", targetRoles: [] });
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    clearDedupedCache();
    const result = await fetchDeduped<CareerData>("/api/career-context", undefined, 0);
    if (request !== generation.current) return;
    setData(result); setRevision((v) => v + 1); setError("");
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    const request = ++generation.current;
    fetchDeduped<CareerData>("/api/career-context", undefined, 0).then((result) => {
      if (!cancelled && request === generation.current) { setData(result); setError(""); }
    }).catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [user?.id, user?.targetRole, user]);
  const change = async (patch: { resumeId?: string; targetRole?: string }) => {
    setBusy(true); setError("");
    try {
      if (patch.targetRole) await updateUserTargetRole(patch.targetRole);
      else await fetchDeduped("/api/career-context", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
    finally { setBusy(false); }
  };
  return { ...data, revision, busy, error, refresh, change, activeResume: data.resumes.find((r) => r.is_active) };
}
const Context = createContext<ReturnType<typeof useCareerState> | null>(null);
function CareerStateProvider({ children }: { children: React.ReactNode }) {
  const value = useCareerState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function CareerProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  // Reset state (remount) hanya saat akun berganti atau logout. Sesi yang baru selesai dimuat
  // (belum diketahui -> akun) tidak me-remount seluruh halaman.
  const [account, setAccount] = useState<{ id: string | null | undefined; generation: number }>({ id: undefined, generation: 0 });
  const id = user?.id ?? null;
  if (!isLoading && id !== account.id) {
    setAccount({ id, generation: account.id ? account.generation + 1 : account.generation });
  }
  return <CareerStateProvider key={account.generation}>{children}</CareerStateProvider>;
}
export function useCareer() {
  const value = useContext(Context);
  if (!value) throw new Error("CareerProvider diperlukan");
  return value;
}
export function CareerContent({ children }: { children: React.ReactNode }) {
  const { revision, busy } = useCareer();
  return <div aria-busy={busy}>
    {busy && <p role="status" className="px-stack-md py-stack-xs bg-sb-mist-soft text-sm text-sb-navy">Memperbarui hasil untuk CV dan target…</p>}
    <div key={revision} className={busy ? "pointer-events-none opacity-60" : undefined} inert={busy}>{children}</div>
  </div>;
}
