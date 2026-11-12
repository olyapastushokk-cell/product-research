// Markdown exports of a card and of a run log. Pure functions.
import type { cardItems, products, runs, sources } from "@/db/schema";
import { sectionTitleFor, sectionsFor, type RunLog } from "@/lib/research/types";

type Product = typeof products.$inferSelect;
type Run = typeof runs.$inferSelect;
type Source = typeof sources.$inferSelect;
type Item = typeof cardItems.$inferSelect;

const cell = (s: string | null | undefined) =>
  (s ?? "").replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ").trim();
const day = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "—");

// Section title for a product card (default) or a topic card.
export const sectionTitle = (key: string | null, kind: string = "product") => sectionTitleFor(kind, key);

// Small labels shown next to a card item.
export function itemLabels(item: Item, source: Source | undefined): string[] {
  const labels: string[] = [];
  if (item.companyClaim) labels.push("company_claim");
  if (source?.check === "verify") labels.push("verify");
  if (source?.addedByUser) labels.push("added_by_user");
  if (item.status === "established" && !item.quoteVerified) labels.push("quote unverified");
  return labels;
}

export function cardToMarkdown(product: Product, run: Run, srcs: Source[], items: Item[]): string {
  const byId = new Map(srcs.map((s) => [s.id, s]));
  const topic = product.kind === "topic";
  const out: string[] = [];
  out.push(`# ${product.name}${topic ? " (тема)" : ""}`, "");
  if (topic) {
    out.push(`- Тема: ${product.input || product.name}`);
    if (product.extraUrls.length > 0) out.push(`- URL користувача: ${product.extraUrls.join(", ")}`);
  } else {
    out.push(`- Сайт: ${product.mainUrl ?? "не визначено"}`);
    if (product.input && product.input !== product.mainUrl) out.push(`- Введено: ${product.input}`);
  }
  out.push(`- Прогін #${run.id}, ${day(run.startedAt ?? run.createdAt)}, статус: ${run.status}`, "");

  for (const section of sectionsFor(product.kind)) {
    const list = items.filter((i) => i.section === section.key);
    if (list.length === 0) continue;
    out.push(`## ${section.title}`, "");
    for (const item of list) {
      const src = item.sourceId ? byId.get(item.sourceId) : undefined;
      const field = item.field ? `**${item.field}:** ` : "";
      let line = `- ${field}${item.value}`;
      if (src?.ref) line += ` [S${src.ref}]`;
      if (item.status === "reference" && item.seeSection) line += ` → ${sectionTitle(item.seeSection, product.kind)}`;
      if (item.status === "not_established") {
        line += ` — Not established${item.reason ? `: ${item.reason}` : ""}`;
      }
      if (item.status === "not_applicable") line += " — Not applicable";
      const labels = itemLabels(item, src);
      if (labels.length) line += ` ${labels.map((l) => `\`${l}\``).join(" ")}`;
      out.push(line);
      if (item.quote) out.push(`  > ${item.quote.replace(/\s*\n\s*/g, " ")}`);
    }
    out.push("");
  }

  out.push("## Джерела", "");
  out.push("| # | URL | Category | Check | Прочитано | Опубліковано | Примітки |");
  out.push("|---|---|---|---|---|---|---|");
  for (const s of srcs) {
    const notes = [s.addedByUser ? "added_by_user" : "", s.relevant ? "" : "не використано", s.note ?? ""]
      .filter(Boolean)
      .join("; ");
    out.push(
      `| S${s.ref} | ${cell(s.url)} | ${s.category} | ${s.check} | ${day(s.dateRead)} | ${cell(s.datePublished)} | ${cell(notes)} |`,
    );
  }
  out.push("");
  return out.join("\n");
}

export function logToMarkdown(product: Product, run: Run): string {
  const log = (run.log ?? null) as RunLog | null;
  const out: string[] = [];
  out.push(`# Лог прогону #${run.id}: ${product.name}`, "");
  out.push(`- Статус: ${run.status}${run.error ? ` — ${run.error}` : ""}`);
  out.push(`- Початок: ${run.startedAt?.toISOString() ?? "—"}; кінець: ${run.finishedAt?.toISOString() ?? "—"}`);
  out.push(`- Сторінок (спроб читання): ${run.pageCount}`);
  out.push(`- Викликів моделі: ${run.modelCalls}`);
  out.push(`- Токени: ${run.inputTokens} вхідних, ${run.outputTokens} вихідних`);
  out.push(`- Вартість (оцінка): $${run.costUsd.toFixed(4)}`);
  if (log?.stoppedBy) out.push(`- Зупинено лімітом: ${log.stoppedBy}`);
  out.push("");
  if (!log) return out.join("\n");

  if (log.map) {
    out.push(
      "## Карта сайту",
      "",
      `- ${log.map.url}: ${log.map.linksFound} посилань${log.map.error ? ` (помилка: ${log.map.error})` : ""}`,
      "",
    );
  }

  out.push("## Пошукові запити", "", "| Тема | Запит | Результатів | Помилка |", "|---|---|---|---|");
  for (const q of log.searchQueries) {
    out.push(`| ${q.topic} | ${cell(q.query)} | ${q.results} | ${cell(q.error)} |`);
  }
  out.push("");

  const list = (title: string, lines: string[]) => {
    out.push(`## ${title}`, "", ...(lines.length ? lines : ["- немає"]), "");
  };
  list("Сторінки, прочитані повністю", log.pagesRead.map((p) => `- [S${p.ref}] ${p.url} (${p.chars} символів)`));
  list(
    "Бачили лише в результатах пошуку",
    log.seenOnlyInSearch.map((p) => `- [${p.topic}] ${p.url}${p.title ? ` — ${p.title}` : ""}`),
  );
  list("Пропущені джерела", log.skipped.map((s) => `- ${s.url} — ${s.reason}`));
  list("Помилки", log.errors.map((e) => `- [${e.stage}] ${e.url ? `${e.url}: ` : ""}${e.message}`));
  if (log.warnings.length > 0) list("Попередження", log.warnings.map((w) => `- ${w}`));

  out.push(
    "## Виклики моделей і вартість",
    "",
    "| Крок | Модель | Вхід | Вихід | $ | Джерело ціни |",
    "|---|---|---|---|---|---|",
  );
  for (const c of log.modelCalls) {
    out.push(
      `| ${cell(c.purpose)} | ${c.model} | ${c.inputTokens} | ${c.outputTokens} | ${c.costUsd.toFixed(4)} | ${c.costSource} |`,
    );
  }
  out.push(`| **Разом** | | ${run.inputTokens} | ${run.outputTokens} | ${run.costUsd.toFixed(4)} | |`, "");
  return out.join("\n");
}
