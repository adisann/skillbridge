import { createHash } from "node:crypto";

/** Hindari tabrakan prefix dan jangan simpan pertanyaan pengguna sebagai kunci plaintext. */
export function promptCacheKey(question: string): string {
  return createHash("sha256").update(question.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase()).digest("hex");
}
