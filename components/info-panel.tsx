import { cn } from "@/lib/utils";

// Light gray info block.
export function InfoPanel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-md bg-muted p-5 text-sm sm:p-6 sm:text-base", className)} {...props} />;
}
