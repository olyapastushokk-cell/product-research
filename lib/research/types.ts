export type GapReason =
  | "not_found"
  | "blocked"
  | "paywall"
  | "login_required"
  | "404"
  | "unsupported_by_scraper"
  | "budget_exhausted";

export type ModelCallLog = {
  purpose: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  costSource: "gateway" | "estimate";
};

export type RunLog = {
  map: { url: string; linksFound: number; error?: string } | null;
  searchQueries: { topic: string; query: string; results: number; error?: string }[];
  pagesRead: { ref: number; url: string; chars: number }[];
  seenOnlyInSearch: { url: string; title?: string; topic: string }[];
  skipped: { url: string; reason: string }[];
  errors: { url?: string; stage: string; message: string }[];
  warnings: string[];
  modelCalls: ModelCallLog[];
  pageCount: number;
  stoppedBy?: string;
};

export function emptyLog(): RunLog {
  return {
    map: null,
    searchQueries: [],
    pagesRead: [],
    seenOnlyInSearch: [],
    skipped: [],
    errors: [],
    warnings: [],
    modelCalls: [],
    pageCount: 0,
  };
}

export const SECTIONS = [
  { key: "company", title: "0. Компанія" },
  { key: "what_it_does", title: "1. Що робить" },
  { key: "who_for", title: "2. Для кого" },
  { key: "pricing", title: "3. Бізнес-модель і ціни" },
  { key: "acquisition", title: "4. Канали залучення" },
  { key: "market_signals", title: "5. Ринкові сигнали" },
  { key: "customer_cases", title: "6. Кейси клієнтів" },
  { key: "reviews", title: "7. Відгуки клієнтів" },
  { key: "competitors", title: "8. Конкуренти" },
  { key: "research_mentions", title: "9. Згадки в дослідженнях" },
  { key: "legal", title: "10. Помітні юридичні факти" },
  { key: "niche_questions", title: "11. Питання ніші" },
  { key: "not_established", title: "12. Не встановлено" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

// Topic mode: a solution or topic, not one company (e.g. "е-ТТН").
export const TOPIC_SECTIONS = [
  { key: "topic_what", title: "1. Що це" },
  { key: "topic_regulation", title: "2. Регулювання і законодавча база" },
  { key: "topic_who_when", title: "3. Для кого і коли обов'язково" },
  { key: "topic_providers", title: "4. Рішення та провайдери" },
  { key: "topic_stats", title: "5. Статистика і поширення" },
  { key: "topic_news", title: "6. Новини і хронологія" },
  { key: "topic_problems", title: "7. Проблеми і скарги" },
  { key: "research_mentions", title: "8. Згадки в дослідженнях" },
  { key: "niche_questions", title: "9. Питання ніші" },
  { key: "not_established", title: "10. Не встановлено" },
] as const;

export function sectionsFor(kind: string | null | undefined): readonly { key: string; title: string }[] {
  return kind === "topic" ? TOPIC_SECTIONS : SECTIONS;
}

export function sectionTitleFor(kind: string | null | undefined, key: string | null): string {
  return sectionsFor(kind).find((s) => s.key === key)?.title ?? key ?? "";
}
