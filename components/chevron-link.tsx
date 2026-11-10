import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Bold dark link with an orange ">" chevron.
export function ChevronLink({
  href,
  children,
  className,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}) {
  const cls = cn(
    "group inline-flex items-center gap-1 font-bold text-foreground hover:text-primary break-all",
    className,
  );
  const content = (
    <>
      <span>{children}</span>
      <ChevronRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {content}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {content}
    </Link>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
      <ChevronRight className="size-4 rotate-180 text-primary" />
      {children}
    </Link>
  );
}
