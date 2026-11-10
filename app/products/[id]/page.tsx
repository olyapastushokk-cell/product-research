import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ChevronDown, Coins, Cpu, Download, FileText, Library, RefreshCw, Search } from "lucide-react";
import { getDb, niches } from "@/db";
import { rebuildCard, startResearch } from "@/app/actions";
import { BackLink, ChevronLink } from "@/components/chevron-link";
import { InfoPanel } from "@/components/info-panel";
import { SectionHeading } from "@/components/section-heading";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadCard } from "@/lib/card/data";
import { itemLabels, sectionTitle } from "@/lib/card/markdown";
import { formatDate } from "@/lib/latest-runs";
import { LIMITS } from "@/lib/research/config";
import { reconcileRun } from "@/lib/research/reconcile";
import type { Resolution } from "@/lib/research/resolve";
import { SECTIONS, type RunLog } from "@/lib/research/types";
import { AutoRefresh } from "./auto-refresh";
import { ChangeInputForm } from "./change-input-form";

export const dynamic = "force-dynamic";

const LABEL_VARIANT: Record<string, "accent" | "default" | "danger"> = {
  company_claim: "accent",
  verify: "default",
  added_by_user: "default",
  "quote unverified": "danger",
};

function Collapsible({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group" open={open}>
      <summary className="flex items-center justify-between gap-2 font-bold">
        {title}
        <ChevronDown className="size-5 text-primary transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

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
      <BackLink href={`/niches/${product.nicheId}`}>{niche?.name ?? "Ніша"}</BackLink>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <SectionHeading as="h1" className="mb-3">
            {product.name}
          </SectionHeading>
          {product.mainUrl ? (
            <ChevronLink href={product.mainUrl} external>
              {product.mainUrl}
            </ChevronLink>
          ) : (
            <p className="text-muted-foreground">Сайт ще не визначено</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={startResearch.bind(null, product.id)}>
            <Button type="submit" disabled={Boolean(active)}>
              <Search /> {run ? "Дослідити знову" : "Дослідити"}
            </Button>
          </form>
          {sources.length > 0 && (
            <form action={rebuildCard.bind(null, product.id)}>
              <Button
                type="submit"
                variant="outline"
                disabled={Boolean(active)}
                title="Зібрати картку заново з уже збережених джерел, без нових читань сторінок"
              >
                <RefreshCw /> Перезібрати картку
              </Button>
            </form>
          )}
          {run && (
            <>
              <Button asChild>
                <a href={`/products/${product.id}/card.md?run=${run.id}`} download>
                  <Download /> Завантажити markdown
                </a>
              </Button>
              <Button asChild>
                <a href={`/products/${product.id}/log.md?run=${run.id}`} download>
                  <Download /> Завантажити лог
                </a>
              </Button>
            </>
          )}
        </div>
      </div>

      {run ? (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <StatusBadge status={run.status} />
          <span>
            Прогін #{run.id} · {formatDate(run.startedAt ?? run.createdAt)}
            {active && " · сторінка оновлюється сама"}
          </span>
        </div>
      ) : (
        <p className="mt-6 text-muted-foreground">Досліджень ще не було.</p>
      )}
      {run?.status === "done" && log?.stoppedBy && (
        <InfoPanel className="mt-4 border-l-4 border-primary">
          <strong>Картку зібрано частково:</strong> {log.stoppedBy}. Розділи, які не встигли заповнити, позначено
          «Not established: budget_exhausted».
        </InfoPanel>
      )}
      {run?.error && (
        <InfoPanel className="mt-4 border-l-4 border-destructive font-semibold text-destructive">
          {run.error}
        </InfoPanel>
      )}

      {run && (
        <section className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          <StatCard icon={FileText} value={`${run.pageCount}`} label={`сторінок прочитано (з ${LIMITS.maxPageReads})`} />
          <StatCard icon={Library} value={`${sources.filter((s) => s.relevant).length}`} label={`джерел у картці (з ${sources.length})`} />
          <StatCard icon={Coins} value={`$${run.costUsd.toFixed(2)}`} label={`вартість (ліміт $${LIMITS.maxCostUsd})`} />
          <StatCard icon={Cpu} value={`${run.modelCalls}`} label={`викликів моделі (з ${LIMITS.maxModelCalls})`} />
        </section>
      )}

      <InfoPanel className="mt-8">
        <Collapsible title="Що досліджуємо" open={!product.mainUrl}>
          <ul className="space-y-1.5">
            <li>
              Ви ввели: <code className="break-all">{product.input || product.mainUrl}</code>
            </li>
            {resolution?.reason && <li>Чому цей сайт: {resolution.reason}</li>}
            {resolution?.confidence && <li>Впевненість: {resolution.confidence}</li>}
            {resolution?.searchQuery && (
              <li>
                Пошуковий запит: <code>{resolution.searchQuery}</code>
              </li>
            )}
            {resolution?.candidates.map((c) => (
              <li key={c.url} className="break-words">
                Інший кандидат: {c.name} —{" "}
                <a href={c.url} className="font-semibold underline">
                  {c.url}
                </a>
                {c.note && <span className="text-muted-foreground"> · {c.note}</span>}
              </li>
            ))}
          </ul>
          {!active && <ChangeInputForm productId={product.id} defaultValue={product.input || product.mainUrl || ""} />}
        </Collapsible>
      </InfoPanel>

      <div className="mt-10 flex flex-col gap-6">
        {SECTIONS.map((section) => {
          const list = items.filter((i) => i.section === section.key);
          if (list.length === 0) return null;
          return (
            <Card key={section.key} id={`section-${section.key}`} className="scroll-mt-6">
              <CardHeader className="pb-0 sm:pb-0">
                <SectionHeading>{section.title}</SectionHeading>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {list.map((item) => {
                    const src = item.sourceId ? sourceById.get(item.sourceId) : undefined;
                    const labels = itemLabels(item, src);
                    return (
                      <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                        <p className="break-words">
                          {item.field && <span className="font-bold">{item.field}: </span>}
                          {item.value}
                          {src?.ref && (
                            <a href={`#S${src.ref}`} className="ml-1.5 font-bold text-primary hover:underline">
                              [S{src.ref}]
                            </a>
                          )}
                          {item.status === "reference" && item.seeSection && (
                            <a href={`#section-${item.seeSection}`} className="ml-1.5 font-bold text-primary hover:underline">
                              → {sectionTitle(item.seeSection)}
                            </a>
                          )}
                        </p>
                        {(labels.length > 0 || item.status === "not_established" || item.status === "not_applicable") && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {item.status === "not_established" && (
                              <Badge>Not established{item.reason ? `: ${item.reason}` : ""}</Badge>
                            )}
                            {item.status === "not_applicable" && <Badge>Not applicable</Badge>}
                            {labels.map((l) => (
                              <Badge key={l} variant={LABEL_VARIANT[l] ?? "default"}>
                                {l}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {item.quote && (
                          <details className="group mt-1.5">
                            <summary className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                              цитата
                              <ChevronDown className="size-3.5 text-primary transition-transform group-open:rotate-180" />
                            </summary>
                            <blockquote
                              className={`mt-2 border-l-2 pl-3 text-sm ${item.quoteVerified ? "border-primary text-muted-foreground" : "border-destructive text-destructive"}`}
                            >
                              «{item.quote}»
                              {!item.quoteVerified && <span className="block text-xs">цитату не знайдено дослівно в джерелі</span>}
                            </blockquote>
                          </details>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sources.length > 0 && (
        <Card className="mt-10">
          <CardHeader className="pb-0 sm:pb-0">
            <SectionHeading>Джерела</SectionHeading>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Check</TableHead>
                  <TableHead>Прочитано</TableHead>
                  <TableHead>Опубліковано</TableHead>
                  <TableHead>Примітки</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((s) => (
                  <TableRow key={s.id} id={`S${s.ref}`} className="scroll-mt-6">
                    <TableCell className="font-bold">S{s.ref}</TableCell>
                    <TableCell className="min-w-56 break-all">
                      <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold hover:text-primary hover:underline">
                        {s.url}
                      </a>
                    </TableCell>
                    <TableCell>{s.category}</TableCell>
                    <TableCell>
                      <Badge variant={s.check === "verify" ? "default" : "success"}>{s.check}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{s.dateRead.toISOString().slice(0, 10)}</TableCell>
                    <TableCell className="min-w-28">{s.datePublished}</TableCell>
                    <TableCell className="min-w-40 text-muted-foreground">
                      {[s.addedByUser ? "added_by_user" : "", s.relevant ? "" : "не використано", s.note ?? ""]
                        .filter(Boolean)
                        .join("; ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {run && (
        <Card className="mt-10">
          <CardContent className="pt-5 sm:pt-6">
            <Collapsible title="Лог прогону і виклики моделей">
              <div className="space-y-6 text-sm">
                <p>
                  Токени: {run.inputTokens.toLocaleString("uk-UA")} вхідних, {run.outputTokens.toLocaleString("uk-UA")}{" "}
                  вихідних · вартість ${run.costUsd.toFixed(4)}
                </p>
                {log && (
                  <>
                    <LogList title="Виклики моделей">
                      {log.modelCalls.map((c, i) => (
                        <li key={i}>
                          {c.purpose} — {c.model}: {c.inputTokens} / {c.outputTokens} токенів, ${c.costUsd.toFixed(4)} (
                          {c.costSource === "gateway" ? "AI Gateway" : "оцінка"})
                        </li>
                      ))}
                    </LogList>
                    <LogList title="Пошукові запити">
                      {log.searchQueries.map((q, i) => (
                        <li key={i}>
                          [{q.topic}] {q.query} — {q.results} результатів{q.error && ` · ${q.error}`}
                        </li>
                      ))}
                    </LogList>
                    <LogList title="Пропущені джерела">
                      {log.skipped.map((s, i) => (
                        <li key={i} className="break-all">
                          {s.url} — {s.reason}
                        </li>
                      ))}
                    </LogList>
                    {log.errors.length > 0 && (
                      <LogList title="Помилки">
                        {log.errors.map((e, i) => (
                          <li key={i} className="break-all">
                            [{e.stage}] {e.url ? `${e.url}: ` : ""}
                            {e.message}
                          </li>
                        ))}
                      </LogList>
                    )}
                    <p className="text-muted-foreground">Повний лог — у файлі «Завантажити лог».</p>
                  </>
                )}
              </div>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {allRuns.length > 1 && (
        <Card className="mt-6">
          <CardContent className="pt-5 sm:pt-6">
            <Collapsible title="Попередні прогони">
              <ul className="space-y-2 text-sm">
                {allRuns.slice(1).map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">#{r.id}</span>
                    <StatusBadge status={r.status} />
                    <span className="text-muted-foreground">
                      {formatDate(r.createdAt)} · ${r.costUsd.toFixed(4)}
                    </span>
                    <ChevronLink external href={`/products/${product.id}/card.md?run=${r.id}`}>картка .md</ChevronLink>
                    <ChevronLink external href={`/products/${product.id}/log.md?run=${r.id}`}>лог .md</ChevronLink>
                  </li>
                ))}
              </ul>
            </Collapsible>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function LogList({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 font-extrabold">{title}</h3>
      <ul className="list-disc space-y-1 pl-5">{children}</ul>
    </div>
  );
}
