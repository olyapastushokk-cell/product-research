import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, niches, products } from "@/db";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) notFound();
  const [niche] = await db.select().from(niches).where(eq(niches.id, product.nicheId));

  return (
    <>
      <p>
        <Link href={`/niches/${product.nicheId}`}>← {niche?.name ?? "Ніша"}</Link>
      </p>
      <h1>{product.name}</h1>
      <p>
        Основна URL: <a href={product.mainUrl}>{product.mainUrl}</a>
      </p>
      {product.extraUrls.length > 0 && (
        <>
          <p>Додаткові URL:</p>
          <ul>
            {product.extraUrls.map((u) => (
              <li key={u}>
                <a href={u}>{u}</a>
              </li>
            ))}
          </ul>
        </>
      )}
      <h2>Картка продукту</h2>
      <p className="muted">Картка ще не зібрана. Дослідження з&apos;явиться на наступному етапі.</p>
    </>
  );
}
