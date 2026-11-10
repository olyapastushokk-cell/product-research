import { loadCard } from "@/lib/card/data";
import { cardToMarkdown } from "@/lib/card/markdown";
import { fileSlug, markdownDownload } from "../download";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const runParam = new URL(request.url).searchParams.get("run");
  const data = Number.isInteger(id) ? await loadCard(id, runParam ? Number(runParam) : undefined) : null;
  if (!data?.run) return new Response("Not found", { status: 404 });
  return markdownDownload(
    cardToMarkdown(data.product, data.run, data.sources, data.items),
    `${fileSlug(data.product.name)}-card-run${data.run.id}.md`,
  );
}
