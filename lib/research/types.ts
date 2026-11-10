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
