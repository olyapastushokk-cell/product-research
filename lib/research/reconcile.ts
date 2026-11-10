import "server-only";
import { eq } from "drizzle-orm";
import { getRun } from "workflow/api";
import { getDb, runs } from "@/db";

type Run = typeof runs.$inferSelect;

const STALE_MS = 30 * 60 * 1000;

// If the background workflow died without updating the run, mark the run failed
// so the product page never hangs on "running".
export async function reconcileRun(run: Run): Promise<Run> {
  if (run.status !== "pending" && run.status !== "running") return run;

  let error: string | null = null;
  if (run.workflowRunId) {
    try {
      const status = await getRun(run.workflowRunId).status;
      if (status === "failed" || status === "cancelled") {
        error = `Background workflow ${status} without saving a result`;
      }
    } catch {
      // Status lookup is best-effort; fall back to the age check below.
    }
  }
  const startedAt = (run.startedAt ?? run.createdAt).getTime();
  if (!error && Date.now() - startedAt > STALE_MS) {
    error = "Run took longer than 30 minutes and was stopped";
  }
  if (!error) return run;

  const [updated] = await getDb()
    .update(runs)
    .set({ status: "failed", error, finishedAt: new Date() })
    .where(eq(runs.id, run.id))
    .returning();
  return updated;
}
