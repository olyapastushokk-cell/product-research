"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { start } from "workflow/api";
import { getDb, niches, products, runs } from "@/db";
import { researchProduct } from "@/workflows/research";
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
  const mainUrl = parseHttpUrl(String(formData.get("mainUrl") ?? ""));
  if (!mainUrl) return { error: "Вкажіть коректну основну URL" };

  const extraLines = String(formData.get("extraUrls") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const extraUrls: string[] = [];
  for (const line of extraLines) {
    const url = parseHttpUrl(line);
    if (!url) return { error: `Некоректна додаткова URL: ${line}` };
    if (url !== mainUrl && !extraUrls.includes(url)) extraUrls.push(url);
  }

  const [product] = await getDb()
    .insert(products)
    .values({ nicheId, name: new URL(mainUrl).hostname.replace(/^www\./, ""), mainUrl, extraUrls })
    .returning({ id: products.id });
  await launchRun(product.id);
  redirect(`/products/${product.id}`);
}

export async function startResearch(productId: number) {
  await launchRun(productId);
  revalidatePath(`/products/${productId}`);
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
