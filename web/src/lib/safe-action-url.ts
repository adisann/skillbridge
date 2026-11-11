/** Tautan dari jawaban AI hanya boleh berupa rute aplikasi atau HTTP(S). */
export function safeActionUrl(value: string): string | null {
  const text = value.trim();
  let decoded: string;
  try { decoded = decodeURIComponent(text); } catch { return null; }
  if (/[\u0000-\u001f\u007f\\]/.test(decoded) || /[\u0000-\u0020\u007f\\]/.test(text)) return null;
  if (text.startsWith("/") && !text.startsWith("//") && !decoded.startsWith("//")) return text;
  try {
    const url = new URL(text);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
