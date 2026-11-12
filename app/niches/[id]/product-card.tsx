import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { startResearch } from "@/app/actions";
import { Favicon } from "@/components/favicon";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Preview } from "@/lib/card/preview";
import { formatDate } from "@/lib/latest-runs";

export type BoardProduct = {
  id: number;
  kind: "product" | "topic";
  name: string;
  domain: string | null;
  input: string;
  status: string | null;
  lastRunAt: Date | null;
  hasCompletedRun: boolean;
  preview: Preview | null;
};

// Whole card is a link (stretched overlay); the "Дослідити" button sits above it.
export function ProductCard({ p }: { p: BoardProduct }) {
  const active = p.status === "running" || p.status === "pending";
  const preview = p.preview;
  const topic = p.kind === "topic";
  return (
    <article className="group relative flex h-full min-w-0 flex-col rounded-md bg-card p-5 shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_50px_rgba(0,0,0,0.14)] sm:p-6">
      <Link href={`/products/${p.id}`} className="absolute inset-0 z-0 rounded-md" aria-label={`Відкрити ${p.name}`} />

      <header className="flex items-center gap-3">
        <Favicon domain={topic ? null : p.domain} name={p.name} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-extrabold leading-tight" title={p.name}>
            {p.name}
          </h2>
          <p className="truncate text-sm text-muted-foreground" title={topic ? undefined : (p.domain ?? p.input)}>
            {topic ? "Тема: кілька джерел, без одного сайту" : (p.domain ?? `ще не визначено: ${p.input}`)}
          </p>
        </div>
        {topic && (
          <Badge variant="accent" className="shrink-0 self-start">
            Тема
          </Badge>
        )}
      </header>

      {p.hasCompletedRun && preview ? (
        <>
          <p className="mt-4 line-clamp-2 min-h-[3em] text-sm" title={preview.description ?? undefined}>
            {preview.description ?? <span className="text-muted-foreground">Опис не встановлено</span>}
          </p>
          {topic ? (
            <div className="mt-4 min-h-[3.25rem]">
              <p className="truncate text-lg font-extrabold text-primary">
                {preview.providersCount ? (
                  `${preview.providersCount} ${preview.providersCount === 1 ? "рішення / провайдер" : "рішень і провайдерів"}`
                ) : (
                  <span className="text-base font-semibold text-muted-foreground">Провайдерів не знайдено</span>
                )}
              </p>
              <p className="truncate text-sm font-semibold">Статистика і поширення:</p>
            </div>
          ) : (
            <div className="mt-4 min-h-[3.25rem]">
              <p className="truncate text-lg font-extrabold text-primary" title={preview.entryPrice ?? undefined}>
                {preview.entryPrice ?? (
                  <span className="text-base font-semibold text-muted-foreground">Ціна не встановлена</span>
                )}
              </p>
              <p className="truncate text-sm font-semibold" title={preview.model ?? undefined}>
                {preview.model ?? <span className="font-normal text-muted-foreground">Модель не встановлена</span>}
              </p>
            </div>
          )}
          <ul className="mt-4 min-h-[2.75rem] space-y-1 text-xs text-muted-foreground">
            {preview.signals.map((s, i) => (
              <li key={i} className="flex min-w-0 items-center gap-1.5">
                <span className="truncate" title={s.text}>
                  {s.text}
                </span>
                {s.companyClaim && (
                  <Badge variant="accent" className="shrink-0 px-1.5 py-0 text-[10px]">
                    company_claim
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-4 flex flex-1 flex-col items-start justify-center gap-3 py-4">
          <p className="text-lg font-extrabold">{active ? "Дослідження триває…" : "Ще не досліджено"}</p>
          {!active && (
            <form action={startResearch.bind(null, p.id)} className="relative z-10">
              <Button type="submit" size="sm">
                <Search /> Дослідити
              </Button>
            </form>
          )}
        </div>
      )}

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <StatusBadge status={p.status} />
          {formatDate(p.lastRunAt)}
        </span>
        <span className="inline-flex items-center gap-0.5 font-bold text-foreground group-hover:text-primary">
          Відкрити <ChevronRight className="size-4 text-primary" />
        </span>
      </footer>
    </article>
  );
}
