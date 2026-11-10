import "server-only";
import { desc, inArray } from "drizzle-orm";
import { getDb, runs } from "@/db";

type Run = typeof runs.$inferSelect;

// Latest run per product.
export async function latestRuns(productIds: number[]): Promise<Map<number, Run>> {
  const map = new Map<number, Run>();
  if (productIds.length === 0) return map;
  const rows = await getDb().select().from(runs).where(inArray(runs.productId, productIds)).orderBy(desc(runs.id));
  for (const r of rows) if (!map.has(r.productId)) map.set(r.productId, r);
  return map;
}

export function formatDate(d: Date | null | undefined) {
  return d
    ? d.toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    : "—";
}
