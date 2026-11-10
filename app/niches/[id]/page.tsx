import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb, niches, products } from "@/db";
import { saveNicheQuestions } from "@/app/actions";
import { NewProductForm } from "./new-product-form";

export const dynamic = "force-dynamic";

export default async function NichePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const db = getDb();
  const [niche] = await db.select().from(niches).where(eq(niches.id, id));
  if (!niche) notFound();
  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.nicheId, id))
    .orderBy(desc(products.createdAt));

  return (
    <>
      <h1>{niche.name}</h1>

      <h2>Продукти</h2>
      {productRows.length === 0 ? (
        <p className="muted">Продуктів ще немає.</p>
      ) : (
        <ul>
          {productRows.map((p) => (
            <li key={p.id}>
              <Link href={`/products/${p.id}`}>{p.name}</Link>{" "}
              <span className="muted">{p.mainUrl ?? `(ще не визначено: ${p.input})`}</span>
            </li>
          ))}
        </ul>
      )}

      <h2>Новий продукт</h2>
      <NewProductForm nicheId={niche.id} />

      <h2>Питання ніші</h2>
      <form action={saveNicheQuestions.bind(null, niche.id)}>
        <textarea name="nicheQuestions" rows={6} defaultValue={niche.nicheQuestions} />
        <button type="submit">Зберегти питання</button>
      </form>
    </>
  );
}
