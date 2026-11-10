// Turns whatever the user typed into clues for finding the product's official site.
// Pure string code: safe in workflow steps and in the app.

export type Resolution = {
  input: string;
  cleaned: string;
  method: "direct" | "search" | "failed";
  domain: string | null;
  url: string | null;
  productName: string | null;
  reason: string;
  confidence: "high" | "medium" | "low" | null;
  candidates: { name: string; url: string; note: string }[];
  searchQuery?: string;
};

export type CleanedInput = {
  // Human-readable text after decoding and removing noise.
  cleaned: string;
  // Text hints (text fragments, search queries, plain words) without own-app links.
  hint: string;
  // Distinct product-domain candidates found in the input.
  domains: { host: string; url: string; fromLink: boolean }[];
  ownAppLink: boolean;
};

const SEARCH_HOSTS = /(^|\.)(google|bing|duckduckgo|yahoo|yandex|baidu|ecosia)\.[a-z.]+$/;
const WRAPPER_HOSTS = /^(t\.co|l\.facebook\.com|lm\.facebook\.com|out\.reddit\.com)$/;
const FILE_TLDS = /\.(png|jpe?g|gif|svg|webp|pdf|html?|php|aspx?|js|css|json|txt|md)$/i;

// Hostnames of this app. Never research them.
export function ownHosts(env: Record<string, string | undefined>): string[] {
  const hosts = [
    env.VERCEL_URL,
    env.VERCEL_BRANCH_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL,
    ...(env.APP_HOSTS ?? "").split(","),
    "localhost",
  ];
  return hosts
    .map((h) => (h ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
    .filter(Boolean);
}

function isOwnHost(host: string, own: string[]): boolean {
  const h = host.replace(/^www\./, "");
  if (own.includes(h)) return true;
  // Any deployment of this project (production, preview, branch URLs).
  return h.startsWith("product-research") && h.endsWith(".vercel.app");
}

function safeDecode(s: string): string {
  let out = s;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(out.replace(/\+/g, " "));
      if (next === out) break;
      out = next;
    } catch {
      break;
    }
  }
  return out;
}

export function cleanInput(raw: string, own: string[]): CleanedInput {
  const input = raw.trim();
  const hints: string[] = [];
  let ownAppLink = false;

  // 1. Text fragments ("link to highlight"): #:~:text=start,end
  const fragIdx = input.indexOf(":~:");
  let rest = input;
  if (fragIdx >= 0) {
    const frag = input.slice(fragIdx + 3);
    for (const part of frag.split("&")) {
      const m = /^text=(.*)$/.exec(part);
      if (m) hints.push(safeDecode(m[1]).replace(/(^|,)-|-(,|$)/g, " ").replace(/,/g, " "));
    }
    rest = input.slice(0, fragIdx);
  }
  // 2. Drop any remaining fragment.
  const hash = rest.indexOf("#");
  if (hash >= 0) rest = rest.slice(0, hash);
  rest = safeDecode(rest).trim();

  // 3. Links in the input: own-app and search-engine links only give hints.
  const domains: CleanedInput["domains"] = [];
  const addDomain = (host: string, url: string, fromLink: boolean) => {
    const h = host.toLowerCase().replace(/^www\./, "");
    if (!h.includes(".") || FILE_TLDS.test(h) || !/\.[a-z]{2,}$/.test(h)) return;
    if (isOwnHost(h, own)) {
      ownAppLink = true;
      return;
    }
    if (SEARCH_HOSTS.test(h) || WRAPPER_HOSTS.test(h)) return;
    if (!domains.some((d) => d.host === h)) domains.push({ host: h, url, fromLink });
  };

  const linkRe = /(https?:\/\/)?((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,})(\/[^\s"'<>]*)?/gi;
  const textOutsideLinks = rest.replace(linkRe, (match, scheme, host: string, path: string | undefined) => {
    const h = host.toLowerCase().replace(/^www\./, "");
    const isOwn = isOwnHost(h, own);
    const isSearch = SEARCH_HOSTS.test(h) || WRAPPER_HOSTS.test(h);
    if ((isOwn || isSearch) && path) {
      // Keep query values (e.g. ?q=synthesia, ?url=...) as hints.
      const q = path.indexOf("?");
      if (q >= 0) {
        for (const pair of path.slice(q + 1).split("&")) {
          const [, v] = pair.split("=");
          if (v) hints.push(safeDecode(v));
        }
      }
    }
    if (isOwn) ownAppLink = true;
    else if (!isSearch) {
      const clean = (path ?? "").replace(/[).,;]+$/, "");
      addDomain(h, `https://${host}${clean}`, Boolean(scheme) || Boolean(path));
    }
    return " ";
  });
  if (textOutsideLinks.trim()) hints.push(textOutsideLinks);

  // 4. Domains mentioned inside hints (e.g. "synthesia.io" in a highlighted text).
  for (const h of [...hints]) {
    for (const m of h.matchAll(linkRe)) addDomain(m[2], `https://${m[2]}${m[3] ?? ""}`, false);
  }

  const hint = hints
    .join(" ")
    .replace(linkRe, (m, _s, host: string) => (isOwnHost(host.toLowerCase(), own) ? " " : m))
    .replace(/\s+/g, " ")
    .trim();
  const cleaned = [domains.map((d) => d.url).join(" "), hint].filter(Boolean).join(" | ");
  return { cleaned, hint, domains, ownAppLink };
}

// Direct resolution without search: exactly one product domain and nothing else to weigh.
export function directResolution(raw: string, c: CleanedInput): Resolution | null {
  if (c.domains.length !== 1) return null;
  const d = c.domains[0];
  const hintWithoutDomain = c.hint.replace(new RegExp(d.host.replace(/\./g, "\\."), "gi"), "").trim();
  // Extra words next to a domain are fine only when the input was a link.
  if (!d.fromLink && hintWithoutDomain.split(/\s+/).filter(Boolean).length > 3 && !c.ownAppLink) {
    return null;
  }
  const url = d.fromLink && !c.ownAppLink ? d.url : `https://${d.host}`;
  return {
    input: raw,
    cleaned: c.cleaned,
    method: "direct",
    domain: d.host,
    url,
    productName: null,
    reason: c.ownAppLink
      ? `Посилання вело на сам застосунок; у ньому знайдено домен продукту ${d.host}.`
      : d.fromLink
        ? `Введено посилання на сайт продукту ${d.host}.`
        : `Введено домен ${d.host}.`,
    confidence: "high",
    candidates: [],
  };
}
