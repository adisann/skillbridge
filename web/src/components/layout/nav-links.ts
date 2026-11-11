export const NAV_LINKS = [
  { href: "/lowongan", label: "Lowongan" },
  { href: "/tren-skill", label: "Tren Skill" },
] as const;

/** Tautan aktif bila halaman saat ini sama atau berada di bawahnya (mis. /lowongan/123). */
export function isNavLinkActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
