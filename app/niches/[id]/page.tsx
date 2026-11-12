import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { PackagePlus } from "lucide-react";
import { cardItems, getDb, niches, products, runs } from "@/db";
import { saveNicheQuestions } from "@/app/actions";
import { AutoRefresh } from "@/app/products/[id]/auto-refresh";
import { BackLink } from "@/components/chevron-link";
import { InfoPanel } from "@/components/info-panel";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { buildPreview } from "@/lib/card/preview";
import { latestRuns } from "@/lib/latest-runs";
import { cn } from "@/lib/utils";
import { NewProductForm } from "./new-product-form";
import { ProductCard, type BoardProduct } from "./product-card";

export const dynamic = "force-dynamic";

const SORTS = [
  { key: "date", label: "Останній прогін" },
  { key: "name", label: "Назва" },
  { key: "price", label: "Ціна входу" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

function domainOf(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function sortProducts(list: BoardProduct[], sort: SortKey) {
  const byName = (a: BoardProduct, b: BoardProduct) => a.name.localeCompare(b.name, "uk");
  return [...list].sort((a, b) => {
    if (sort === "name") return byName(a, b);
    if (sort === "price") {
      // Unknown prices go last.
      const pa = a.preview?.entryPriceValue ?? Infinity;
      const pb = b.preview?.entryPriceValue ?? Infinity;
      return pa === pb ? byName(a, b) : pa - pb;
    }
    return (b.lastRunAt?.getTime() ?? 0) - (a.lastRunAt?.getTime() ?? 0) || byName(a, b);
  });
}

export default async function NichePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const sortParam = (await searchParams).sort;
  const sort: SortKey = SORTS.some((s) => s.key === sortParam) ? (sortParam as SortKey) : "date";

  const db = getDb();
  const [niche] = await db.select().from(niches).where(eq(niches.id, id));
  if (!niche) notFound();
  const productRows = await db.select().from(products).where(eq(products.nicheId, id)).orderBy(desc(products.createdAt));
  const ids = productRows.map((p) => p.id);
  const lastRun = await latestRuns(ids);

  // Previews come from the latest completed run of each product.
  const doneRuns =
    ids.length > 0
      ? await db
          .select({ id: runs.id, productId: runs.productId })
          .from(runs)
          .where(and(inArray(runs.productId, ids), eq(runs.status, "done")))
          .orderBy(desc(runs.id))
      : [];
  const lastDone = new Map<number, number>();
  for (const r of doneRuns) if (!lastDone.has(r.productId)) lastDone.set(r.productId, r.id);
  const doneIds = [...lastDone.values()];
  const items = doneIds.length > 0 ? await db.select().from(cardItems).where(inArray(cardItems.runId, doneIds)) : [];

  const board: BoardProduct[] = productRows.map((p) => {
    const run = lastRun.get(p.id);
    const doneRunId = lastDone.get(p.id);
    return {
      id: p.id,
      kind: p.kind === "topic" ? "topic" : "product",
      name: p.name,
      domain: domainOf(p.mainUrl),
      input: p.input,
      status: run?.status ?? null,
      lastRunAt: run ? (run.startedAt ?? run.createdAt) : null,
      hasCompletedRun: doneRunId !== undefined,
      preview:
        doneRunId !== undefined ? buildPreview(items.filter((i) => i.runId === doneRunId), p.kind) : null,
    };
  });
  const sorted = sortProducts(board, sort);
  const anyActive = board.some((p) => p.status === "running" || p.status === "pending");

  return (
    <>
      {anyActive && <AutoRefresh />}
      <BackLink href="/">Усі ніші</BackLink>
      <SectionHeading as="h1">{niche.name}</SectionHeading>

      {board.length === 0 ? (
        <InfoPanel className="mt-8 flex flex-col items-center gap-4 py-10 text-center sm:py-14">
          <PackagePlus className="size-12 text-primary" strokeWidth={1.4} />
          <div>
            <p className="text-xl font-extrabold">У цій ніші ще немає продуктів</p>
            <p className="mt-1 text-muted-foreground">
              Введіть URL, домен або назву продукту — або перемкніть на «Тема» (наприклад, «е-ТТН»), щоб
              дослідити рішення без одного сайту.
            </p>
          </div>
          <Card className="w-full max-w-2xl text-left">
            <CardContent className="pt-5 sm:pt-6">
              <NewProductForm nicheId={niche.id} autoFocus />
            </CardContent>
          </Card>
        </InfoPanel>
      ) : (
        <>
          <Card className="mt-6">
            <CardContent className="pt-5 sm:pt-6">
              <NewProductForm nicheId={niche.id} />
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {board.length} {board.length === 1 ? "продукт" : "продуктів"}
            </p>
            <nav aria-label="Сортування" className="flex flex-wrap items-center gap-1.5 text-sm">
              <span className="mr-1 text-muted-foreground">Сортувати:</span>
              {SORTS.map((s) => (
                <Link
                  key={s.key}
                  href={`/niches/${niche.id}?sort=${s.key}`}
                  scroll={false}
                  className={cn(
                    "rounded-full border px-3 py-1 font-semibold transition-colors",
                    s.key === sort
                      ? "border-primary bg-primary text-white"
                      : "border-border text-foreground hover:border-primary hover:text-primary",
                  )}
                >
                  {s.label}
                </Link>
              ))}
            </nav>
          </div>

          <section className="mt-5 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </section>
        </>
      )}

      <Card className="mt-12">
        <CardContent className="pt-5 sm:pt-6">
          <details className="group">
            <summary className="flex flex-col">
              <SectionHeading className="mb-1">Питання ніші</SectionHeading>
              <span className="text-sm text-muted-foreground">
                Необов&apos;язкові додаткові питання. Повна картка збирається завжди. Натисніть, щоб редагувати.
              </span>
            </summary>
            <form action={saveNicheQuestions.bind(null, niche.id)} className="mt-4 flex flex-col gap-4">
              <Textarea name="nicheQuestions" rows={6} defaultValue={niche.nicheQuestions} />
              <div>
                <Button type="submit" variant="outline">
                  Зберегти питання
                </Button>
              </div>
            </form>
          </details>
        </CardContent>
      </Card>
    </>
  );
}
