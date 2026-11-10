"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createNiche, type FormState } from "./actions";
import { FormError } from "./form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewNicheForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createNiche, {});
  return (
    <form action={action} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <Label className="flex-1">
        Назва нової ніші
        <Input type="text" name="name" required placeholder="Наприклад, AI video" />
      </Label>
      <Button type="submit" disabled={pending}>
        <Plus /> Створити нішу
      </Button>
      <FormError error={state.error} />
    </form>
  );
}
