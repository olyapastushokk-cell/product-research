// Plain string helpers (safe in workflow and step code).

export function hostOf(url: string): string {
  const m = /^https?:\/\/([^/?#:]+)/i.exec(url.trim());
  return (m?.[1] ?? "").toLowerCase();
}

export function baseHost(url: string): string {
  return hostOf(url).replace(/^www\./, "");
}

export function isOnDomain(url: string, base: string): boolean {
  const h = hostOf(url).replace(/^www\./, "");
  return h === base || h.endsWith(`.${base}`);
}

// Key for de-duplication: lowercase, no fragment, no trailing slash.
export function urlKey(url: string): string {
  let u = url.trim().toLowerCase();
  const hash = u.indexOf("#");
  if (hash >= 0) u = u.slice(0, hash);
  while (u.endsWith("/")) u = u.slice(0, -1);
  return u.replace(/^https?:\/\/(www\.)?/, "");
}
