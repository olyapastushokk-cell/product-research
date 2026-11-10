"use client";

import { useActionState } from "react";
import { updateProductInput, type FormState } from "@/app/actions";
import { FormError } from "@/app/form-error";

export function ChangeInputForm({ productId, defaultValue }: { productId: number; defaultValue: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateProductInput.bind(null, productId),
    {},
  );
  return (
    <form action={action}>
      <label>
        Вказати продукт заново (URL, домен або назва)
        <input type="text" name="input" defaultValue={defaultValue} required />
      </label>
      <FormError error={state.error} />
      <button type="submit" disabled={pending}>Змінити і дослідити</button>
    </form>
  );
}
