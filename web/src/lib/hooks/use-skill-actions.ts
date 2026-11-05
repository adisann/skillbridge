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
export function useSkillActions({ isGuest, role, onSkillClaimed }: UseSkillActionsOptions) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (message: string, durationMs: number) => {
    setNotice(message);
    setTimeout(() => setNotice(null), durationMs);
  };

  const addLearning = async (skillName: string, reason?: string, priority: string = "Tinggi") => {
    if (isGuest) {
      router.push(LOGIN_URL);
      return;
    }

    let message = `Skill '${skillName}' berhasil ditambahkan ke daftar target belajar.`;
    try {
      await fetchDeduped("/api/learning-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillName,
          reason: reason || `Kebutuhan skill ${skillName} tinggi di pasar (${role}) namun belum ditemukan di CV.`,
          priority,
        }),
      });
    } catch {
      message = `Skill '${skillName}' disimpan ke target belajar.`;
    }
    showNotice(message, 3500);
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
      onSkillClaimed();
    } catch {
      message = "Gagal menandai skill.";
    }
    showNotice(message, 4000);
  };

  return { notice, addLearning, claimSkill };
}
