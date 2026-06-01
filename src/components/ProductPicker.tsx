"use client";

import { Boxes, MapPin, PackageSearch, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductPickerItem = {
  id: number;
  name: string;
  sku: string;
  unit?: string;
  currentStock?: number;
  colorName?: string | null;
  packageSize?: string | null;
  rackLocation?: string | null;
};

export default function ProductPicker({
  products,
  value,
  onChange,
  query,
  onQueryChange,
  name = "productId",
  label = "Cari Produk",
  placeholder = "Cari nama, SKU, warna…",
  emptyText = "Tidak ada produk yang cocok.",
  stockLabel = "Stok",
}: {
  products: ProductPickerItem[];
  value: string;
  onChange: (id: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  name?: string;
  label?: string;
  placeholder?: string;
  emptyText?: string;
  stockLabel?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="hidden" name={name} value={value} />
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="input pl-9"
          autoComplete="off"
        />
      </div>
      <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-line bg-surface p-1.5 scrollbar-thin">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center text-[12.5px] text-ink-muted">
            <PackageSearch className="h-6 w-6 text-ink-subtle" />
            {emptyText}
          </div>
        ) : (
          <div className="space-y-1" role="listbox" aria-label={label}>
            {products.map((p) => {
              const selected = value === String(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onChange(String(p.id))}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md border px-3 py-2 text-left transition",
                    selected
                      ? "border-accent bg-accent-soft shadow-sm"
                      : "border-transparent hover:border-line hover:bg-canvas"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md",
                      selected ? "bg-surface text-accent" : "bg-canvas text-ink-muted"
                    )}
                  >
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="mono text-[12px] font-semibold text-ink-soft">{p.sku}</span>
                      {p.currentStock !== undefined ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                            p.currentStock <= 0
                              ? "bg-danger-softer text-danger-text"
                              : "bg-ok-bg text-ok-text"
                          )}
                        >
                          {stockLabel}: {p.currentStock}{p.unit ? ` ${p.unit}` : ""}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 truncate text-[13.5px] font-semibold text-ink">
                      {p.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-ink-muted">
                      {p.colorName ? <span>{p.colorName}</span> : null}
                      {p.packageSize ? <span>{p.packageSize}</span> : null}
                      {p.rackLocation ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {p.rackLocation}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
