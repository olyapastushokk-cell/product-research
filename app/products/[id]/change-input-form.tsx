"use client";

import { useActionState } from "react";
import { updateProductInput, type FormState } from "@/app/actions";
import { FormError } from "@/app/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangeInputForm({ productId, defaultValue }: { productId: number; defaultValue: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProductInput.bind(null, productId), {});
  return (
    <form action={action} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
      <Label className="flex-1">
        Вказати продукт заново (URL, домен або назва)
        <Input type="text" name="input" defaultValue={defaultValue} required className="bg-white" />
      </Label>
      <Button type="submit" disabled={pending} variant="outline">
        Змінити і дослідити
      </Button>
      <FormError error={state.error} />
    </form>
  );
}
