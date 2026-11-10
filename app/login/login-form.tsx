"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/actions";
import { FormError } from "@/app/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Label>
        Пароль
        <Input type="password" name="password" required autoFocus />
      </Label>
      <FormError error={state.error} />
      <Button type="submit" disabled={pending}>
        Увійти
      </Button>
    </form>
  );
}
