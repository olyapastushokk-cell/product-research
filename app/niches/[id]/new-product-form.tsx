"use client";

import { useActionState } from "react";
import { Search } from "lucide-react";
import { createProduct, type FormState } from "@/app/actions";
import { FormError } from "@/app/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Compact "add product" form: one line on desktop, extra URLs behind a toggle.
export function NewProductForm({ nicheId, autoFocus = false }: { nicheId: number; autoFocus?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createProduct.bind(null, nicheId), {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row">
        <Input
          type="text"
          name="input"
          aria-label="Продукт: URL, домен або назва"
          placeholder="Додати продукт: URL, домен або назва"
          required
          autoFocus={autoFocus}
          className="md:flex-1"
        />
        <Button type="submit" disabled={pending}>
          <Search /> Дослідити
        </Button>
      </div>
      <details>
        <summary className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          + Додаткові URL (необов&apos;язково)
        </summary>
        <Textarea name="extraUrls" rows={3} placeholder="По одній URL на рядок" className="mt-2" />
      </details>
      <FormError error={state.error} />
    </form>
  );
}
