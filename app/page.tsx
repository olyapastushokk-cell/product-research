import { desc } from "drizzle-orm";
import { FolderOpen } from "lucide-react";
import { getDb, niches, products } from "@/db";
import { ChevronLink } from "@/components/chevron-link";
import { InfoPanel } from "@/components/info-panel";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, latestRuns } from "@/lib/latest-runs";
import { NewNicheForm } from "./new-niche-form";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getDb();
  const rows = await db.select().from(niches).orderBy(desc(niches.createdAt));
  const allProducts = await db.select({ id: products.id, nicheId: products.nicheId }).from(products);
  const runsByProduct = await latestRuns(allProducts.map((p) => p.id));

  const cards = rows.map((n) => {
    const ids = allProducts.filter((p) => p.nicheId === n.id).map((p) => p.id);
    const last = ids
      .map((id) => runsByProduct.get(id))
      .filter((r) => r !== undefined)
      .sort((a, b) => b.id - a.id)[0];
    return { niche: n, count: ids.length, last };
  });

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <SectionHeading as="h1" className="mb-0">
          Ніші
        </SectionHeading>
        <InfoPanel>
          Створіть нішу, додайте продукти — агент збере про кожен <strong>картку з первинних джерел</strong>: що
          робить, ціни, канали, відгуки, конкуренти.
        </InfoPanel>
      </div>

      <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.length === 0 && <p className="text-muted-foreground">Ніш ще немає.</p>}
        {cards.map(({ niche, count, last }) => (
          <Card key={niche.id} className="flex flex-col">
            <CardHeader>
              <FolderOpen className="size-8 text-primary" strokeWidth={1.4} />
              <CardTitle className="mt-2 text-xl break-words">{niche.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {count} {count === 1 ? "продукт" : "продуктів"}
              </p>
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {formatDate(last?.createdAt)} <StatusBadge status={last?.status} />
              </div>
              <ChevronLink href={`/niches/${niche.id}`}>Відкрити</ChevronLink>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="mt-10">
        <CardHeader>
          <SectionHeading className="mb-0">Нова ніша</SectionHeading>
        </CardHeader>
        <CardContent>
          <NewNicheForm />
        </CardContent>
      </Card>
    </>
  );
}
