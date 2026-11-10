"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/actions";
import { FormError } from "@/app/form-error";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />
      <label>
        Пароль
        <input type="password" name="password" required autoFocus />
      </label>
      <FormError error={state.error} />
      <button type="submit" disabled={pending}>Увійти</button>
    </form>
  );
}
