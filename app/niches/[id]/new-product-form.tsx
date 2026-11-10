"use client";

import { useActionState } from "react";
import { createProduct, type FormState } from "@/app/actions";
import { FormError } from "@/app/form-error";

export function NewProductForm({ nicheId }: { nicheId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createProduct.bind(null, nicheId),
    {},
  );
  return (
    <form action={action}>
      <label>
        Продукт: URL, домен або назва
        <input type="text" name="input" placeholder="https://example.com, example.com або Example" required />
      </label>
      <label>
        Додаткові URL (необов&apos;язково, по одній на рядок)
        <textarea name="extraUrls" rows={3} />
      </label>
      <FormError error={state.error} />
      <button type="submit" disabled={pending}>Дослідити</button>
    </form>
  );
}
