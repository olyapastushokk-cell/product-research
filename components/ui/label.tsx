import * as React from "react";
import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label data-slot="label" className={cn("flex flex-col gap-2 text-sm font-semibold", className)} {...props} />;
}

export { Label };
