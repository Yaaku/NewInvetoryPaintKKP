"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { openCommandPalette } from "@/components/CommandPalette";

export default function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K opens the command palette.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCommandPalette();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        openCommandPalette();
      }}
      className="relative w-full max-w-md"
    >
      <button
        type="button"
        onClick={() => openCommandPalette()}
        aria-label="Buka palet perintah"
        className="flex h-9 w-full items-center gap-2 rounded-md border border-line bg-canvas pl-3 pr-2 text-left text-[13.5px] text-ink-subtle outline-none transition hover:border-line-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
      >
        <Search className="h-4 w-4 text-ink-subtle" />
        <span className="flex-1 truncate">Cari produk, SKU, batch, atau perintah…</span>
        <kbd className="hidden select-none rounded border border-line bg-surface px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-muted md:inline-block">
          ⌘K
        </kbd>
      </button>
      <input
        ref={inputRef}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onFocus={() => openCommandPalette()}
      />
    </form>
  );
}
