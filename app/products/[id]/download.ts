import "server-only";

// Builds a .md file download response.
export function markdownDownload(body: string, filename: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function fileSlug(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return slug.replace(/^-+/, "").replace(/-+$/, "") || "product";
}
