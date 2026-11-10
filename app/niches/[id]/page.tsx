import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Package } from "lucide-react";
import { getDb, niches, products } from "@/db";
import { saveNicheQuestions } from "@/app/actions";
import { BackLink, ChevronLink } from "@/components/chevron-link";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, latestRuns } from "@/lib/latest-runs";
import { NewProductForm } from "./new-product-form";

export const dynamic = "force-dynamic";

function domainOf(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function NichePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const db = getDb();
  const [niche] = await db.select().from(niches).where(eq(niches.id, id));
  if (!niche) notFound();
  const productRows = await db.select().from(products).where(eq(products.nicheId, id)).orderBy(desc(products.createdAt));
  const runsByProduct = await latestRuns(productRows.map((p) => p.id));

  return (
    <>
      <BackLink href="/">Усі ніші</BackLink>
      <SectionHeading as="h1">{niche.name}</SectionHeading>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {productRows.length === 0 && <p className="text-muted-foreground">Продуктів ще немає.</p>}
        {productRows.map((p) => {
          const run = runsByProduct.get(p.id);
          return (
            <Card key={p.id} className="flex flex-col">
              <CardHeader>
                <Package className="size-8 text-primary" strokeWidth={1.4} />
                <CardTitle className="mt-2 text-xl break-words">{p.name}</CardTitle>
                <p className="text-sm break-all text-muted-foreground">
                  {domainOf(p.mainUrl) ?? `ще не визначено: ${p.input}`}
                </p>
              </CardHeader>
              <CardContent className="mt-auto flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {formatDate(run?.createdAt)} <StatusBadge status={run?.status} />
                </div>
                <ChevronLink href={`/products/${p.id}`}>Відкрити</ChevronLink>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <SectionHeading className="mb-0">Новий продукт</SectionHeading>
          </CardHeader>
          <CardContent>
            <NewProductForm nicheId={niche.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading className="mb-0">Питання ніші</SectionHeading>
            <p className="text-sm text-muted-foreground">
              Необов&apos;язкові додаткові питання. Повна картка збирається завжди.
            </p>
          </CardHeader>
          <CardContent>
            <form action={saveNicheQuestions.bind(null, niche.id)} className="flex flex-col gap-4">
              <Textarea name="nicheQuestions" rows={6} defaultValue={niche.nicheQuestions} />
              <div>
                <Button type="submit" variant="outline">
                  Зберегти питання
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
