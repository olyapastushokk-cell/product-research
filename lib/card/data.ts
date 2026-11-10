import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { cardItems, getDb, products, runs, sources } from "@/db";

// Product with its latest run (or a given run), sources and card items.
export async function loadCard(productId: number, runId?: number) {
  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product) return null;
  const allRuns = await db.select().from(runs).where(eq(runs.productId, productId)).orderBy(desc(runs.id));
  const run = runId ? allRuns.find((r) => r.id === runId) : allRuns[0];
  const runSources = run
    ? await db.select().from(sources).where(eq(sources.runId, run.id)).orderBy(asc(sources.ref))
    : [];
  const items = run
    ? await db.select().from(cardItems).where(eq(cardItems.runId, run.id)).orderBy(asc(cardItems.id))
    : [];
  return { product, run, allRuns, sources: runSources, items };
}
