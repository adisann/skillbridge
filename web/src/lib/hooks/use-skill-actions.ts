import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchDeduped, clearDedupedCache } from "@/lib/fetcher";

interface UseSkillActionsOptions {
  isGuest: boolean;
  role: string;
  onSkillClaimed: () => void;
}

const LOGIN_URL = `/login?next=${encodeURIComponent("/tren-skill")}`;

/** Aksi pada skill pasar: tambah ke target belajar dan tandai "saya kuasai". */
export function useSkillActions({ isGuest, onSkillClaimed }: UseSkillActionsOptions) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (message: string, durationMs: number) => {
    setNotice(message);
    setTimeout(() => setNotice(null), durationMs);
  };

  const claimSkill = async (skillName: string) => {
    if (isGuest) {
      router.push(LOGIN_URL);
      return;
    }

    let message: string;
    try {
      clearDedupedCache("/api/insights");
      const data = await fetchDeduped<{ message?: string; error?: string }>("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName }),
      });
      message = data.message || `Skill '${skillName}' ditandai dikuasai.`;
      clearDedupedCache();
      onSkillClaimed();
    } catch {
      message = "Gagal menandai skill.";
    }
    showNotice(message, 4000);
  };

  return { notice, claimSkill };
}
