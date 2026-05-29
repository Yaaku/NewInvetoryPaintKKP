"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K focuses the search box
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari produk, SKU, batch…"
        aria-label="Cari inventaris"
        className="h-9 w-full rounded-md border border-line bg-canvas pl-9 pr-12 text-[13.5px] text-ink outline-none transition placeholder:text-ink-subtle focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none rounded border border-line bg-white px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-muted md:inline-block">
        ⌘K
      </kbd>
    </form>
  );
}
