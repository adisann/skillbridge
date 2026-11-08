"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { fetchDeduped } from "@/lib/fetcher";
import { normalizeSkillName, type LearningItem } from "@/lib/learning";

function useLearningState() {
  const { user } = useAuth();
  const [items, setItems] = useState<LearningItem[]>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [isLoading, setLoading] = useState(!!user);
  const [loadError, setLoadError] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const locks = useRef(new Set<string>());

  const reload = useCallback(async () => {
    const id = user?.id;
    if (!id) return;
    try {
      const data = await fetchDeduped<{ learningItems: LearningItem[]; aliases: Record<string, string> }>("/api/learning-items", undefined, 0);
      setItems(data.learningItems); setAliases(data.aliases || {}); setLoadError("");
    } catch (e) {
      setLoadError((e as Error).message);
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let live = true;
    fetchDeduped<{ learningItems: LearningItem[]; aliases: Record<string, string> }>("/api/learning-items", undefined, 0)
      .then((data) => { if (live) { setItems(data.learningItems); setAliases(data.aliases || {}); setLoadError(""); } })
      .catch((e: Error) => { if (live) setLoadError(e.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [user?.id]);

  const keyFor = (name: string) => aliases[normalizeSkillName(name)] || normalizeSkillName(name);
  const find = (name: string) => items.find((it) => !it.duplicateOf && (it.skillKey === keyFor(name) || normalizeSkillName(it.skillName) === normalizeSkillName(name)));
  const add = async (skillName: string, reason?: string, priority = "Tinggi", sourceJobId?: string) => {
    const key = keyFor(skillName);
    const existing = find(skillName);
    if (existing) return existing;
    if (locks.current.has(key)) return;
    locks.current.add(key); setPending((p) => [...p, key]);
    try {
      const data = await fetchDeduped<{ item: LearningItem }>("/api/learning-items", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName, reason, priority, sourceJobId }),
      });
      setItems((p) => [data.item, ...p.filter((it) => it.id !== data.item.id)]);
      setAliases((p) => ({ ...p, [normalizeSkillName(skillName)]: data.item.skillKey }));
      return data.item;
    } finally {
      locks.current.delete(key); setPending((p) => p.filter((v) => v !== key));
    }
  };
  const update = async (id: string, patch: Partial<Pick<LearningItem, "notes" | "priority" | "isDone">>) => {
    const data = await fetchDeduped<{ item: LearningItem }>("/api/learning-items", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
    setItems((p) => p.map((it) => it.id === id ? data.item : it));
  };
  const remove = async (id: string) => {
    await fetchDeduped(`/api/learning-items?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setItems((p) => p.filter((it) => it.id !== id));
  };
  return { items, isLoading, loadError, reload, add, update, remove, find, isPending: (name: string) => pending.includes(keyFor(name)) };
}

const Context = createContext<ReturnType<typeof useLearningState> | null>(null);
function LearningStateProvider({ children }: { children: React.ReactNode }) {
  const value = useLearningState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useLearning() {
  const value = useContext(Context);
  if (!value) throw new Error("LearningProvider diperlukan");
  return value;
}

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <LearningStateProvider key={user?.id || "guest"}>{children}</LearningStateProvider>;
}
