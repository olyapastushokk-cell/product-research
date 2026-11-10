import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, niches } from "@/db";
import { startResearch } from "@/app/actions";
import { loadCard } from "@/lib/card/data";
import { itemLabels, sectionTitle } from "@/lib/card/markdown";
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

  const data = await loadCard(id);
  if (!data) notFound();
  const { product, allRuns, sources, items } = data;
  const [niche] = await getDb().select().from(niches).where(eq(niches.id, product.nicheId));
  const run = data.run ? await reconcileRun(data.run) : undefined;
  const active = run && (run.status === "pending" || run.status === "running");
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const log = (run?.log ?? null) as RunLog | null;
  const resolution = (product.resolution ?? null) as Resolution | null;

  return (
    <>
      {active && <AutoRefresh />}
      <p>
        <Link href={`/niches/${product.nicheId}`}>← {niche?.name ?? "Ніша"}</Link>
      </p>
      <h1>{product.name}</h1>
      <p>
        {product.mainUrl ? (
          <a href={product.mainUrl}>{product.mainUrl}</a>
        ) : (
          <span className="muted">Сайт ще не визначено</span>
        )}
      </p>

      <details>
        <summary>Як визначено продукт</summary>
        <ul>
          <li>
            Ви ввели: <code>{product.input || product.mainUrl}</code>
          </li>
          {resolution?.reason && <li>Чому цей сайт: {resolution.reason}</li>}
          {resolution?.confidence && <li>Впевненість: {resolution.confidence}</li>}
          {resolution?.searchQuery && (
            <li>
              Пошуковий запит: <code>{resolution.searchQuery}</code>
            </li>
          )}
          {resolution?.candidates.map((c) => (
            <li key={c.url}>
              Інший кандидат: {c.name} — <a href={c.url}>{c.url}</a>
              {c.note && <span className="muted"> · {c.note}</span>}
            </li>
          ))}
        </ul>
        {!active && <ChangeInputForm productId={product.id} defaultValue={product.input || product.mainUrl || ""} />}
      </details>

      <div className="toolbar">
        <form action={startResearch.bind(null, product.id)}>
          <button type="submit" disabled={Boolean(active)}>
            {run ? "Дослідити знову" : "Дослідити"}
          </button>
        </form>
        {run && (
          <>
            <a className="button" href={`/products/${product.id}/card.md?run=${run.id}`} download>
              Завантажити markdown
            </a>
            <a className="button" href={`/products/${product.id}/log.md?run=${run.id}`} download>
              Завантажити лог
            </a>
          </>
        )}
      </div>

      {run && (
        <p className="muted">
          Прогін #{run.id}: <strong>{STATUS_LABEL[run.status] ?? run.status}</strong>
          {active && " (сторінка оновлюється сама)"} · сторінок {run.pageCount}/{LIMITS.maxPageReads} · викликів
          моделі {run.modelCalls}/{LIMITS.maxModelCalls} · ${run.costUsd.toFixed(4)} з ${LIMITS.maxCostUsd}
        </p>
      )}
      {run?.error && <p className="error">Помилка: {run.error}</p>}
      {!run && <p className="muted">Досліджень ще не було.</p>}

      {SECTIONS.map((section) => {
        const list = items.filter((i) => i.section === section.key);
        if (list.length === 0) return null;
        return (
          <section key={section.key} id={`section-${section.key}`}>
            <h2>{section.title}</h2>
            <ul className="card">
              {list.map((item) => {
                const src = item.sourceId ? sourceById.get(item.sourceId) : undefined;
                const labels = itemLabels(item, src);
                return (
                  <li key={item.id}>
                    {item.field && <strong>{item.field}: </strong>}
                    {item.value}
                    {src?.ref && (
                      <>
                        {" "}
                        <a href={`#S${src.ref}`}>[S{src.ref}]</a>
                      </>
                    )}
                    {item.status === "reference" && item.seeSection && (
                      <>
                        {" "}
                        <a href={`#section-${item.seeSection}`}>→ {sectionTitle(item.seeSection)}</a>
                      </>
                    )}
                    {item.status === "not_established" && (
                      <span className="tag">Not established{item.reason ? `: ${item.reason}` : ""}</span>
                    )}
                    {item.status === "not_applicable" && <span className="tag">Not applicable</span>}
                    {labels.map((l) => (
                      <span key={l} className={l === "quote unverified" ? "tag tag-warn" : "tag"}>
                        {l}
                      </span>
                    ))}
                    {item.quote && (
                      <details className="quote">
                        <summary>цитата</summary>
                        <blockquote>{item.quote}</blockquote>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {sources.length > 0 && (
        <>
          <h2>Джерела</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>URL</th>
                  <th>Category</th>
                  <th>Check</th>
                  <th>Прочитано</th>
                  <th>Опубліковано</th>
                  <th>Примітки</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id} id={`S${s.ref}`}>
                    <td>S{s.ref}</td>
                    <td className="url">
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.url}
                      </a>
                    </td>
                    <td>{s.category}</td>
                    <td>{s.check}</td>
                    <td>{s.dateRead.toISOString().slice(0, 10)}</td>
                    <td>{s.datePublished}</td>
                    <td className="muted">
                      {[s.addedByUser ? "added_by_user" : "", s.relevant ? "" : "не використано", s.note ?? ""]
                        .filter(Boolean)
                        .join("; ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {run && (
        <details>
          <summary>Лог прогону і виклики моделей</summary>
          <p>
            Токени: {run.inputTokens.toLocaleString("uk-UA")} вхідних, {run.outputTokens.toLocaleString("uk-UA")}{" "}
            вихідних · оцінка вартості ${run.costUsd.toFixed(4)}
          </p>
          {log && (
            <>
              <h3>Виклики моделей</h3>
              <ul>
                {log.modelCalls.map((c, i) => (
                  <li key={i}>
                    {c.purpose} — {c.model}: {c.inputTokens} / {c.outputTokens} токенів, ${c.costUsd.toFixed(4)} (
                    {c.costSource === "gateway" ? "AI Gateway" : "оцінка"})
                  </li>
                ))}
              </ul>
              <h3>Пошукові запити</h3>
              <ul>
                {log.searchQueries.map((q, i) => (
                  <li key={i}>
                    [{q.topic}] {q.query} — {q.results} результатів{q.error && ` · ${q.error}`}
                  </li>
                ))}
              </ul>
              <h3>Пропущені джерела</h3>
              <ul>
                {log.skipped.map((s, i) => (
                  <li key={i}>
                    {s.url} — {s.reason}
                  </li>
                ))}
              </ul>
              {log.errors.length > 0 && (
                <>
                  <h3>Помилки</h3>
                  <ul>
                    {log.errors.map((e, i) => (
                      <li key={i}>
                        [{e.stage}] {e.url ? `${e.url}: ` : ""}
                        {e.message}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <p className="muted">Повний лог — у файлі «Завантажити лог».</p>
            </>
          )}
        </details>
      )}

      {allRuns.length > 1 && (
        <details>
          <summary>Попередні прогони</summary>
          <ul>
            {allRuns.slice(1).map((r) => (
              <li key={r.id}>
                #{r.id} · {STATUS_LABEL[r.status] ?? r.status} · {r.createdAt.toISOString().slice(0, 16)} · $
                {r.costUsd.toFixed(4)} · <a href={`/products/${product.id}/card.md?run=${r.id}`}>картка .md</a> ·{" "}
                <a href={`/products/${product.id}/log.md?run=${r.id}`}>лог .md</a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
