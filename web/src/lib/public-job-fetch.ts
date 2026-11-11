import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class PublicJobUrlError extends Error {}

function isPublicAddress(address: string): boolean {
  if (isIP(address) === 6) {
    // Only globally routable unicast; exclude documentation addresses as well.
    return /^[23][0-9a-f]{0,3}:/i.test(address) && !/^2001:db8:/i.test(address);
  }
  if (isIP(address) !== 4) return false;
  const [first, second] = address.split(".").map(Number);
  return !(first === 0 || first === 10 || first === 127 || first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && (second === 168 || second === 0)) ||
    (first === 198 && (second === 18 || second === 19)));
}

export function isSafePublicJobUrl(value: string): { isSafe: boolean; reason?: string } {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase().replace(/\.$/, "");
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      return { isSafe: false, reason: "Gunakan URL HTTP/HTTPS publik tanpa kredensial." };
    }
    if (host === "localhost" || /\.(?:localhost|local|internal)\.?$/.test(host) ||
      (isIP(host) !== 0 && !isPublicAddress(host))) {
      return { isSafe: false, reason: "Akses ke jaringan privat atau lokal diblokir." };
    }
    return { isSafe: true };
  } catch {
    return { isSafe: false, reason: "Format URL tidak valid." };
  }
}

type Network = {
  fetch: typeof fetch;
  lookup: (host: string, options: { all: true; verbatim: true }) => Promise<{ address: string; family: number }[]>;
};

export async function fetchPublicJobPage(
  value: string,
  init: RequestInit = {},
  network: Network = { fetch, lookup },
): Promise<Response> {
  let current = new URL(value);
  for (let redirects = 0; redirects <= 5; redirects++) {
    const safety = isSafePublicJobUrl(current.href);
    if (!safety.isSafe) throw new PublicJobUrlError(safety.reason);
    const host = current.hostname.replace(/^\[|\]$/g, "");
    const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] :
      await network.lookup(host, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
      throw new PublicJobUrlError("Domain tujuan mengarah ke jaringan privat atau lokal.");
    }
    init.signal?.throwIfAborted();
    const response = await network.fetch(current, { ...init, redirect: "manual", credentials: "omit" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    await response.body?.cancel();
    if (!location) throw new PublicJobUrlError("Pengalihan sumber lowongan tidak valid.");
    current = new URL(location, current);
  }
  throw new PublicJobUrlError("Terlalu banyak pengalihan dari sumber lowongan.");
}
