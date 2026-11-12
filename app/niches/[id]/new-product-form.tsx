"use client";

import { useActionState, useState } from "react";
import { Search } from "lucide-react";
import { createProduct, type FormState } from "@/app/actions";
import { FormError } from "@/app/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Kind = "product" | "topic";

const COPY: Record<Kind, { placeholder: string; aria: string; urls: string; urlsHint: string }> = {
  product: {
    placeholder: "Додати продукт: URL, домен або назва",
    aria: "Продукт: URL, домен або назва",
    urls: "+ Додаткові URL (необов'язково)",
    urlsHint: "По одній URL на рядок",
  },
  topic: {
    placeholder: "Тема, наприклад: е-ТТН",
    aria: "Назва теми",
    urls: "+ Ваші URL про тему (необов'язково, читаються першими)",
    urlsHint: "Офіційні сторінки, закони, статті — по одній URL на рядок",
  },
};

// Compact "add" form: Product / Topic toggle, one line on desktop, URLs behind a toggle.
export function NewProductForm({ nicheId, autoFocus = false }: { nicheId: number; autoFocus?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createProduct.bind(null, nicheId), {});
  const [kind, setKind] = useState<Kind>("product");
  const copy = COPY[kind];
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="kind" value={kind} />
      <div role="radiogroup" aria-label="Що досліджуємо" className="flex w-fit rounded-full bg-muted p-1 text-sm font-bold">
        {(["product", "topic"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-1.5 transition-colors",
              kind === k ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {k === "product" ? "Продукт" : "Тема"}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <Input
          type="text"
          name="input"
          aria-label={copy.aria}
          placeholder={copy.placeholder}
          required
          autoFocus={autoFocus}
          className="md:flex-1"
        />
        <Button type="submit" disabled={pending}>
          <Search /> Дослідити
        </Button>
      </div>
      <details open={kind === "topic" ? true : undefined}>
        <summary className="text-xs font-semibold text-muted-foreground hover:text-foreground">{copy.urls}</summary>
        <Textarea name="extraUrls" rows={3} placeholder={copy.urlsHint} className="mt-2" />
      </details>
      <FormError error={state.error} />
    </form>
  );
}
