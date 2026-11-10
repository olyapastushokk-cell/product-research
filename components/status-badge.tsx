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
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
