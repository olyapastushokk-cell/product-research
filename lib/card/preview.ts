// Product preview for the niche board, built only from existing card items (no model calls).
import type { cardItems } from "@/db/schema";

type Item = typeof cardItems.$inferSelect;

export type Preview = {
  description: string | null;
  model: string | null;
  // "Free → $19/міс", "$19/міс", "Free" or null.
  entryPrice: string | null;
  // Lowest paid amount, for sorting (Free only = 0).
  entryPriceValue: number | null;
  signals: { text: string; companyClaim: boolean }[];
  // Topic mode: number of solutions / providers found (null for products).
  providersCount: number | null;
};

const FREE_RE = /\b(free|freemium)\b|безкошт/i;
const MODEL_FIELD_RE = /модел|model|тип/i;
const NUM = "\\d{1,3}(?:[ ,\\u00a0]\\d{3})+(?:[.,]\\d+)?|\\d+(?:[.,]\\d+)?";
const PRICE_RE = new RegExp(`([$€£₴])\\s?(${NUM})|(${NUM})\\s?(USD|EUR|GBP|UAH|грн|₴|\\$|€)`, "gi");
// Period right after the price (before any next price).
const PERIOD_RE = /^\s*(\/\s*(міс|month|mo\b|mon)|на місяць|per month|a month|monthly|щомісяч)/i;
const YEAR_RE = /^\s*(\/\s*(рік|year|yr)|на рік|per year|a year|annually|щоріч)/i;

const toNumber = (s: string) => Number(s.replace(/[ ,\u00a0](?=\d{3}\b)/g, "").replace(",", "."));

function established(items: Item[], section: string) {
  return items.filter((i) => i.section === section && i.status === "established");
}

// Lowest paid price. Monthly (or period-less) prices win; yearly only if nothing else.
function lowestPrice(items: Item[]): { label: string; value: number } | null {
  const found: { label: string; value: number; yearly: boolean }[] = [];
  for (const item of items) {
    const text = `${item.field ?? ""} ${item.value}`;
    for (const m of text.matchAll(PRICE_RE)) {
      const symbol = m[1] ?? normalizeCurrency(m[4] ?? "");
      const value = toNumber(m[2] ?? m[3] ?? "");
      if (!Number.isFinite(value) || value <= 0) continue;
      const end = (m.index ?? 0) + m[0].length;
      const after = text.slice(end, end + 20);
      const yearly = YEAR_RE.test(after);
      const period = yearly ? "/рік" : PERIOD_RE.test(after) ? "/міс" : "";
      const amount = Number.isInteger(value) ? String(value) : value.toFixed(2);
      const label = symbol === "грн" ? `${amount} грн${period}` : `${symbol}${amount}${period}`;
      found.push({ label, value: yearly ? value / 12 : value, yearly });
    }
  }
  const pool = found.some((f) => !f.yearly) ? found.filter((f) => !f.yearly) : found;
  const best = pool.sort((a, b) => a.value - b.value)[0];
  return best ? { label: best.label, value: best.value } : null;
}

function normalizeCurrency(c: string) {
  const u = c.toUpperCase();
  if (u === "USD" || c === "$") return "$";
  if (u === "EUR" || c === "€") return "€";
  if (u === "GBP") return "£";
  if (u === "UAH" || c === "₴" || c === "грн") return "грн";
  return c;
}

export function buildPreview(items: Item[], kind: string = "product"): Preview {
  if (kind === "topic") {
    const what = established(items, "topic_what");
    const stats = established(items, "topic_stats");
    return {
      description: what[0]?.value ?? null,
      model: null,
      entryPrice: null,
      entryPriceValue: null,
      providersCount: established(items, "topic_providers").length,
      signals: stats.slice(0, 2).map((i) => ({
        text: i.field ? `${i.field}: ${i.value}` : i.value,
        companyClaim: i.companyClaim,
      })),
    };
  }
  const what = established(items, "what_it_does");
  const pricing = established(items, "pricing");
  const signals = established(items, "market_signals");

  const description =
    what.find((i) => /опис|description|що робить/i.test(i.field ?? ""))?.value ?? what[0]?.value ?? null;
  const model = pricing.find((i) => MODEL_FIELD_RE.test(i.field ?? ""))?.value ?? null;

  const hasFree = pricing.some((i) => FREE_RE.test(`${i.field ?? ""} ${i.value}`));
  const paid = lowestPrice(pricing);
  const entryPrice = paid ? (hasFree ? `Free → ${paid.label}` : paid.label) : hasFree ? "Free" : null;
  const entryPriceValue = paid ? paid.value : hasFree ? 0 : null;

  return {
    description,
    model,
    entryPrice,
    entryPriceValue,
    providersCount: null,
    signals: signals.slice(0, 2).map((i) => ({
      text: i.field ? `${i.field}: ${i.value}` : i.value,
      companyClaim: i.companyClaim,
    })),
  };
}
