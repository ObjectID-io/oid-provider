/**
 * If `input` is a valid absolute URL and represents only an origin (no path/query/hash),
 * ensure it ends with a trailing slash.
 *
 * Why: some Move modules compare prefixes using std::string::substring with the on-chain
 * linked_domain length. If linked_domain is stored with a trailing slash ("https://x/")
 * but the client passes "https://x", substring(0, linked_len) will abort out-of-bounds.
 */
export function ensureTrailingSlashForOriginOnly(input: unknown): string {
  const s = String(input ?? "").trim();
  if (!s) return s;

  try {
    const u = new URL(s);
    const isOriginOnly = u.pathname === "/" && !u.search && !u.hash;
    if (isOriginOnly && !s.endsWith("/")) return s + "/";
  } catch {
    // Not a URL; return as-is.
  }

  return s;
}
