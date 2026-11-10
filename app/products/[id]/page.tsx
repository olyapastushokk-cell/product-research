import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { cardItems, getDb, niches, products, runs, sources } from "@/db";
import { startResearch } from "@/app/actions";
import { LIMITS } from "@/lib/research/config";
import { reconcileRun } from "@/lib/research/reconcile";
import type { Resolution } from "@/lib/research/resolve";
import { SECTIONS, type RunLog } from "@/lib/research/types";
import { AutoRefresh } from "./auto-refresh";
import { ChangeInputForm } from "./change-input-form";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "в черзі",
  running: "виконується",
  done: "готово",
  failed: "помилка",
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) notFound();
  const [niche] = await db.select().from(niches).where(eq(niches.id, product.nicheId));
  const allRuns = await db.select().from(runs).where(eq(runs.productId, id)).orderBy(desc(runs.id));
  const run = allRuns[0] ? await reconcileRun(allRuns[0]) : undefined;
  const active = run && (run.status === "pending" || run.status === "running");

  const runSources = run
    ? await db.select().from(sources).where(eq(sources.runId, run.id)).orderBy(asc(sources.ref))
    : [];
  const items = run
    ? await db.select().from(cardItems).where(eq(cardItems.runId, run.id)).orderBy(asc(cardItems.id))
    : [];
  const refById = new Map(runSources.map((s) => [s.id, s.ref]));
  const log = (run?.log ?? null) as RunLog | null;
  const resolution = (product.resolution ?? null) as Resolution | null;

  return (
    <>
      {active && <AutoRefresh />}
      <p>
        <Link href={`/niches/${product.nicheId}`}>← {niche?.name ?? "Ніша"}</Link>
      </p>
      <h1>{product.name}</h1>
      <h2>Що досліджуємо</h2>
      <ul>
        <li>
          Ви ввели: <code>{product.input || product.mainUrl}</code>
        </li>
        <li>
          Визначений сайт:{" "}
          {product.mainUrl ? (
            <a href={product.mainUrl}>{product.mainUrl}</a>
          ) : (
            <span className="muted">ще не визначено</span>
          )}
        </li>
        {resolution?.reason && <li>Чому: {resolution.reason}</li>}
        {resolution?.confidence && <li>Впевненість: {resolution.confidence}</li>}
        {resolution?.searchQuery && (
          <li>
            Пошуковий запит: <code>{resolution.searchQuery}</code>
          </li>
        )}
      </ul>
      {resolution && resolution.candidates.length > 0 && (
        <>
          <p>Інші кандидати (тезки):</p>
          <ul>
            {resolution.candidates.map((c) => (
              <li key={c.url}>
                {c.name} — <a href={c.url}>{c.url}</a>
                {c.note && <span className="muted"> · {c.note}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      {!active && (
        <details open={!product.mainUrl}>
          <summary>Змінити продукт</summary>
          <ChangeInputForm productId={product.id} defaultValue={product.input || product.mainUrl || ""} />
        </details>
      )}
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

      <form action={startResearch.bind(null, product.id)}>
        <button type="submit" disabled={Boolean(active)}>
          {run ? "Дослідити знову" : "Дослідити"}
        </button>
      </form>

      <h2>Прогін</h2>
      {!run ? (
        <p className="muted">Досліджень ще не було.</p>
      ) : (
        <>
          <p>
            Статус: <strong>{STATUS_LABEL[run.status] ?? run.status}</strong>
            {active && " (сторінка оновлюється сама)"}
          </p>
          {run.error && <p className="error">Помилка: {run.error}</p>}
          <ul>
            <li>
              Сторінок прочитано: {run.pageCount} / {LIMITS.maxPageReads}
            </li>
            <li>
              Викликів моделі: {run.modelCalls} / {LIMITS.maxModelCalls}
            </li>
            <li>
              Токени: {run.inputTokens.toLocaleString("uk-UA")} вхідних,{" "}
              {run.outputTokens.toLocaleString("uk-UA")} вихідних
            </li>
            <li>
              Оцінка вартості: ${run.costUsd.toFixed(4)} (ліміт ${LIMITS.maxCostUsd})
            </li>
          </ul>
          {log && log.modelCalls.length > 0 && (
            <details>
              <summary>Виклики моделей</summary>
              <ul>
                {log.modelCalls.map((c, i) => (
                  <li key={i}>
                    {c.purpose} — {c.model}: {c.inputTokens} / {c.outputTokens} токенів, $
                    {c.costUsd.toFixed(4)} ({c.costSource === "gateway" ? "AI Gateway" : "оцінка"})
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      {run && items.length > 0 && (
        <>
          <h2>Пункти картки (сирий список)</h2>
          {SECTIONS.map((section) => {
            const sectionItems = items.filter((i) => i.section === section.key);
            if (sectionItems.length === 0) return null;
            return (
              <section key={section.key} id={`section-${section.key}`}>
                <h3>{section.title}</h3>
                <ul>
                  {sectionItems.map((item) => {
                    const ref = item.sourceId ? refById.get(item.sourceId) : undefined;
                    return (
                      <li key={item.id}>
                        {item.field && <strong>{item.field}: </strong>}
                        {item.value}
                        {ref && (
                          <>
                            {" "}
                            <a href={`#S${ref}`}>[S{ref}]</a>
                          </>
                        )}
                        {item.companyClaim && <span className="muted"> · company_claim</span>}
                        {item.status === "reference" && item.seeSection && (
                          <>
                            {" "}
                            <a href={`#section-${item.seeSection}`}>
                              → {SECTIONS.find((x) => x.key === item.seeSection)?.title ?? item.seeSection}
                            </a>
                          </>
                        )}
                        {item.status === "established" && !item.quoteVerified && (
                          <strong className="error"> · quote unverified</strong>
                        )}
                        {(item.status === "not_established" || item.status === "not_applicable") && (
                          <span className="muted">
                            {" "}
                            · {item.status === "not_applicable" ? "Not applicable" : "Not established"}
                            {item.reason ? `: ${item.reason}` : ""}
                          </span>
                        )}
                        {item.quote && (
                          <div className={item.quoteVerified ? "muted" : "error"}>
                            «{item.quote}»
                            {!item.quoteVerified && " (цитату не знайдено дослівно в джерелі)"}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </>
      )}

      {runSources.length > 0 && (
        <>
          <h2>Джерела</h2>
          <ol>
            {runSources.map((s) => (
              <li key={s.id} id={`S${s.ref}`} value={s.ref ?? undefined}>
                [S{s.ref}] <a href={s.url}>{s.url}</a> · {s.category} · {s.check} · прочитано{" "}
                {s.dateRead.toISOString().slice(0, 10)} · опубліковано: {s.datePublished}
                {s.addedByUser && " · added_by_user"}
                {!s.relevant && <span className="muted"> · не використано</span>}
                {s.note && <span className="muted"> · {s.note}</span>}
              </li>
            ))}
          </ol>
        </>
      )}

      {log && (
        <details>
          <summary>Лог прогону</summary>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(log, null, 2)}</pre>
        </details>
      )}

      {allRuns.length > 1 && (
        <>
          <h2>Попередні прогони</h2>
          <ul>
            {allRuns.slice(1).map((r) => (
              <li key={r.id}>
                #{r.id} · {STATUS_LABEL[r.status] ?? r.status} · {r.createdAt.toISOString().slice(0, 16)} · $
                {r.costUsd.toFixed(4)}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
