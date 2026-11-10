import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb, niches } from "@/db";
import { logout } from "./actions";
import { NewNicheForm } from "./new-niche-form";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rows = await getDb().select().from(niches).orderBy(desc(niches.createdAt));
  return (
    <>
      <h1>Ніші</h1>
      {rows.length === 0 ? (
        <p className="muted">Ніш ще немає.</p>
      ) : (
        <ul>
          {rows.map((n) => (
            <li key={n.id}>
              <Link href={`/niches/${n.id}`}>{n.name}</Link>
            </li>
          ))}
        </ul>
      )}
      <NewNicheForm />
      <form action={logout}>
        <button type="submit">Вийти</button>
      </form>
    </>
  );
}
