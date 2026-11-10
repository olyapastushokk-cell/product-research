"use client";

import { useActionState } from "react";
import { Search } from "lucide-react";
import { createProduct, type FormState } from "@/app/actions";
import { FormError } from "@/app/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function NewProductForm({ nicheId }: { nicheId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createProduct.bind(null, nicheId), {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Label>
        Продукт: URL, домен або назва
        <Input type="text" name="input" placeholder="https://example.com, example.com або Example" required />
      </Label>
      <Label>
        <span>
          Додаткові URL <span className="font-normal text-muted-foreground">(необов&apos;язково, по одній на рядок)</span>
        </span>
        <Textarea name="extraUrls" rows={3} />
      </Label>
      <FormError error={state.error} />
      <div>
        <Button type="submit" disabled={pending}>
          <Search /> Дослідити
        </Button>
      </div>
    </form>
  );
}
