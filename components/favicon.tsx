"use client";

import { useState } from "react";

// Site favicon; falls back to the first letter in an orange circle.
export function Favicon({ domain, name }: { domain: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const letter = (name.trim()[0] ?? "?").toUpperCase();
  if (!domain || failed) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white">
        {letter}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
      alt=""
      width={40}
      height={40}
      loading="lazy"
      onError={() => setFailed(true)}
      onLoad={(e) => {
        // Google returns a 16px placeholder when a site has no icon.
        if (e.currentTarget.naturalWidth <= 16) setFailed(true);
      }}
      className="size-10 shrink-0 rounded-full bg-muted object-contain p-1.5"
    />
  );
}
