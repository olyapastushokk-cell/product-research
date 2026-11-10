"use client";

import { useActionState } from "react";
import { createNiche, type FormState } from "./actions";
import { FormError } from "./form-error";

export function NewNicheForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createNiche, {});
  return (
    <form action={action}>
      <label>
        Назва нової ніші
        <input type="text" name="name" required />
      </label>
      <FormError error={state.error} />
      <button type="submit" disabled={pending}>Створити нішу</button>
    </form>
  );
}
