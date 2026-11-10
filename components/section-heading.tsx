import { cn } from "@/lib/utils";

// Bold heading with a short orange bar underneath.
export function SectionHeading({
  children,
  as: Tag = "h2",
  className,
}: {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const size =
    Tag === "h1"
      ? "text-3xl sm:text-5xl"
      : Tag === "h2"
        ? "text-xl sm:text-2xl"
        : "text-lg";
  return (
    <div className={cn("mb-5", className)}>
      <Tag className={cn("font-extrabold leading-tight tracking-tight break-words", size)}>{children}</Tag>
      <span aria-hidden className={cn("mt-3 block bg-primary", Tag === "h1" ? "h-1.5 w-16" : "h-1 w-10")} />
    </div>
  );
}
