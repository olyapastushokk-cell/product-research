import { Badge } from "@/components/ui/badge";

const STATUS: Record<string, { label: string; variant: "success" | "default" | "danger" | "accent" }> = {
  pending: { label: "в черзі", variant: "default" },
  running: { label: "виконується", variant: "accent" },
  done: { label: "готово", variant: "success" },
  failed: { label: "помилка", variant: "danger" },
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <Badge>не досліджено</Badge>;
  const s = STATUS[status] ?? { label: status, variant: "default" as const };
  const live = status === "running" || status === "pending";
  return (
    <Badge variant={s.variant}>
      {live && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      )}
      {s.label}
    </Badge>
  );
}
