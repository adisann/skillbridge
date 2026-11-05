import type { RateRule } from "@/lib/rate-limit";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const BUSY_MESSAGE = "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.";

/** Unggah CV: dibatasi per pengguna, per IP, dan global agar penyimpanan Cloudflare R2 tidak disalahgunakan. */
export function cvUploadRules(ip: string, userId: string): RateRule[] {
  return [
    { scope: "cv-upload:user-hour", key: userId, limit: 5, windowSeconds: HOUR, message: "Batas unggah CV per jam tercapai (maks. 5). Coba lagi nanti." },
    { scope: "cv-upload:user-day", key: userId, limit: 15, windowSeconds: DAY, message: "Batas unggah CV harian tercapai (maks. 15). Coba lagi besok." },
    { scope: "cv-upload:ip-hour", key: ip, limit: 10, windowSeconds: HOUR, message: "Terlalu banyak unggahan dari jaringan ini. Coba lagi nanti." },
    { scope: "cv-upload:ip-day", key: ip, limit: 30, windowSeconds: DAY, message: "Batas unggah harian untuk jaringan ini tercapai. Coba lagi besok." },
    { scope: "cv-upload:global-day", key: "global", limit: 500, windowSeconds: DAY, message: "Layanan unggah CV sedang mencapai batas harian. Coba lagi besok." },
  ];
}

/** Pemeriksaan awal chat AI sebelum identitas pengguna diketahui. */
export function chatBurstRules(ip: string): RateRule[] {
  return [{ scope: "chat:ip-minute", key: ip, limit: 20, windowSeconds: MINUTE, message: BUSY_MESSAGE }];
}

/** Batas chat AI per pengguna login atau per IP untuk tamu, ditambah batas global harian. */
export function chatQuotaRules(ip: string, userId: string | null): RateRule[] {
  const actor: RateRule[] = userId
    ? [
        { scope: "chat:user-minute", key: userId, limit: 10, windowSeconds: MINUTE, message: BUSY_MESSAGE },
        { scope: "chat:user-day", key: userId, limit: 150, windowSeconds: DAY, message: "Kuota tanya asisten AI hari ini sudah habis. Coba lagi besok." },
      ]
    : [
        { scope: "chat:guest-day", key: ip, limit: 20, windowSeconds: DAY, message: "Kuota tanya asisten AI untuk tamu hari ini sudah habis. Masuk untuk kuota lebih besar." },
      ];
  return [
    ...actor,
    { scope: "chat:ip-day", key: ip, limit: 300, windowSeconds: DAY, message: "Kuota tanya asisten AI dari jaringan ini hari ini sudah habis." },
    { scope: "chat:global-day", key: "global", limit: 3000, windowSeconds: DAY, message: "Asisten AI sedang mencapai batas harian. Coba lagi besok." },
  ];
}

/** Impor lowongan admin yang memanggil AI (OCR poster dan ekstraksi tautan). */
export function adminAiImportRules(adminId: string): RateRule[] {
  return [
    { scope: "admin-ai:user-hour", key: adminId, limit: 30, windowSeconds: HOUR, message: "Batas impor AI per jam tercapai. Coba lagi nanti." },
    { scope: "admin-ai:global-day", key: "global", limit: 200, windowSeconds: DAY, message: "Batas impor AI harian tercapai. Coba lagi besok." },
  ];
}

/** Percobaan login dan masuk demo per IP (menahan tebak kata sandi). */
export function authAttemptRules(ip: string): RateRule[] {
  return [
    { scope: "auth:ip-10min", key: ip, limit: 30, windowSeconds: 10 * MINUTE, message: "Terlalu banyak percobaan masuk. Tunggu beberapa menit lalu coba lagi." },
    { scope: "auth:ip-day", key: ip, limit: 300, windowSeconds: DAY, message: "Terlalu banyak percobaan masuk dari jaringan ini. Coba lagi besok." },
  ];
}
