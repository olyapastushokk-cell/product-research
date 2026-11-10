"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import { start } from "workflow/api";
import { getDb, niches, products, runs, sources } from "@/db";
import { rebuildCard as rebuildCardWorkflow, researchProduct } from "@/workflows/research";
import { AUTH_COOKIE, authToken } from "@/lib/auth";
import { parseHttpUrl } from "@/lib/urls";

export type FormState = { error?: string };

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const expected = process.env.APP_PASSWORD;
  const password = String(formData.get("password") ?? "");
  if (!expected || password !== expected) return { error: "Невірний пароль" };

  (await cookies()).set(AUTH_COOKIE, await authToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  const next = String(formData.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  (await cookies()).delete(AUTH_COOKIE);
  redirect("/login");
}

export async function createNiche(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Вкажіть назву ніші" };
  const [niche] = await getDb().insert(niches).values({ name }).returning({ id: niches.id });
  redirect(`/niches/${niche.id}`);
}

export async function saveNicheQuestions(nicheId: number, formData: FormData) {
  const nicheQuestions = String(formData.get("nicheQuestions") ?? "");
  await getDb().update(niches).set({ nicheQuestions }).where(eq(niches.id, nicheId));
  revalidatePath(`/niches/${nicheId}`);
}

export async function createProduct(
  nicheId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Anything is accepted: URL, bare domain, product name or a messy link.
  // The research run resolves it to the official site.
  const input = String(formData.get("input") ?? "").trim().slice(0, 2000);
  if (!input) return { error: "Вкажіть продукт: URL, домен або назву" };

  const extra = parseExtraUrls(String(formData.get("extraUrls") ?? ""));
  if ("error" in extra) return extra;

  const [product] = await getDb()
    .insert(products)
    .values({ nicheId, name: input.slice(0, 80), input, extraUrls: extra.urls })
    .returning({ id: products.id });
  await launchRun(product.id);
  redirect(`/products/${product.id}`);
}

// Replaces what the user typed and resolves it again on the next run.
export async function updateProductInput(
  productId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const input = String(formData.get("input") ?? "").trim().slice(0, 2000);
  if (!input) return { error: "Вкажіть продукт: URL, домен або назву" };
  await getDb()
    .update(products)
    .set({ input, name: input.slice(0, 80), mainUrl: null, resolution: null })
    .where(eq(products.id, productId));
  await launchRun(productId);
  revalidatePath(`/products/${productId}`);
  return {};
}

function parseExtraUrls(text: string): { urls: string[] } | { error: string } {
  const urls: string[] = [];
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const url = parseHttpUrl(line);
    if (!url) return { error: `Некоректна додаткова URL: ${line}` };
    if (!urls.includes(url)) urls.push(url);
  }
  return { urls };
}

export async function startResearch(productId: number) {
  await launchRun(productId);
  revalidatePath(`/products/${productId}`);
  revalidatePath("/niches/[id]", "page");
}

// Creates a run row and starts the background workflow. Errors are saved on the run.
async function launchRun(productId: number) {
  const db = getDb();
  const active = await db
    .select({ id: runs.id })
    .from(runs)
    .where(and(eq(runs.productId, productId), inArray(runs.status, ["pending", "running"])));
  if (active.length > 0) return;

  const [run] = await db.insert(runs).values({ productId }).returning({ id: runs.id });
  try {
    const wf = await start(researchProduct, [run.id]);
    await db.update(runs).set({ workflowRunId: wf.runId }).where(eq(runs.id, run.id));
  } catch (e) {
    await db
      .update(runs)
      .set({
        status: "failed",
        finishedAt: new Date(),
        error: `Could not start run: ${e instanceof Error ? e.message : String(e)}`,
      })
      .where(eq(runs.id, run.id));
  }
}

// Rebuilds the card of the latest run that has saved sources, without new Firecrawl reads.
export async function rebuildCard(productId: number) {
  const db = getDb();
  const productRuns = await db.select().from(runs).where(eq(runs.productId, productId)).orderBy(desc(runs.id));
  if (productRuns.some((r) => r.status === "pending" || r.status === "running")) return;
  let target: number | undefined;
  for (const r of productRuns) {
    const [src] = await db.select({ id: sources.id }).from(sources).where(eq(sources.runId, r.id)).limit(1);
    if (src) {
      target = r.id;
      break;
    }
  }
  if (target === undefined) return;
  await db.update(runs).set({ status: "pending", error: null, startedAt: new Date() }).where(eq(runs.id, target));
  try {
    const wf = await start(rebuildCardWorkflow, [target]);
    await db.update(runs).set({ workflowRunId: wf.runId }).where(eq(runs.id, target));
  } catch (e) {
    await db
      .update(runs)
      .set({
        status: "failed",
        finishedAt: new Date(),
        error: `Could not start rebuild: ${e instanceof Error ? e.message : String(e)}`,
      })
      .where(eq(runs.id, target));
  }
  revalidatePath(`/products/${productId}`);
}
