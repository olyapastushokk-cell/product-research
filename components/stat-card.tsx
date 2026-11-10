import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

// Big bold number with a thin orange line icon and a label.
export function StatCard({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-3 py-6 text-center sm:py-8">
      <Icon className="size-9 text-primary sm:size-11" strokeWidth={1.4} />
      <div className="text-2xl font-extrabold leading-none tracking-tight sm:text-4xl">{value}</div>
      <div className="text-xs text-muted-foreground sm:text-sm">{label}</div>
    </Card>
  );
}
