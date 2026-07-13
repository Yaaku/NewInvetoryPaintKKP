"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PackageSearch, Search } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export type LookupProduct = {
  id: number;
  name: string;
  sku: string;
  colorName: string | null;
  colorCode: string | null;
  brand: string | null;
  category: string | null;
  unit: string;
  currentStock: number;
  minStock: number;
};

const MAX_ROWS = 60;

/**
 * Counter tool for staff: type a paint name/SKU/warna to instantly check whether
 * it is in stock and how much. Filters client-side so results update as you type.
 */
export default function StockLookup({ products }: { products: LookupProduct[] }) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      `${p.name} ${p.sku} ${p.colorName ?? ""} ${p.colorCode ?? ""} ${p.brand ?? ""} ${p.category ?? ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [q, products]);

  const shown = results.slice(0, MAX_ROWS);

  return (
    <section className="panel">
      <header className="panel-header">
        <div className="flex items-center gap-2">
          <PackageSearch className="h-[16px] w-[16px] text-ink-muted" />
          <h2 className="panel-title">Cek Stok Barang</h2>
        </div>
        <span className="text-[12px] text-ink-muted">
          {results.length} produk
        </span>
      </header>

      <div className="border-b border-line p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            placeholder="Cari nama cat, SKU, warna, atau merek…"
            className="input pl-9"
            aria-label="Cari stok barang"
          />
        </div>
      </div>

      <div className="max-h-[520px] overflow-y-auto scrollbar-thin">
        <table className="tbl">
          <thead className="sticky top-0 z-10">
            <tr>
              <th>Produk</th>
              <th>Warna</th>
              <th className="text-right">Stok</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-[13px] text-ink-muted">
                  Tidak ada produk yang cocok dengan &ldquo;{q}&rdquo;.
                </td>
              </tr>
            ) : (
              shown.map((p) => {
                const out = p.currentStock <= 0;
                const low = !out && p.currentStock <= p.minStock;
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/products/${p.id}`} className="font-medium text-ink hover:underline">
                        {p.name}
                      </Link>
                      <div className="mono text-[11px] uppercase text-ink-subtle">{p.sku}</div>
                    </td>
                    <td className="text-[13px] text-ink-soft">{p.colorName ?? "—"}</td>
                    <td className="text-right">
                      <span
                        className={`mono font-semibold ${
                          out ? "text-danger-text" : low ? "text-warn-textStrong" : "text-ink"
                        }`}
                      >
                        {formatNumber(p.currentStock)}
                      </span>
                      <span className="text-[12px] text-ink-muted"> {p.unit}</span>
                    </td>
                    <td className="text-center">
                      {out ? (
                        <span className="pill-danger">Habis</span>
                      ) : low ? (
                        <span className="pill-warn">Menipis</span>
                      ) : (
                        <span className="badge badge-ok px-2 py-0.5">Tersedia</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {results.length > MAX_ROWS ? (
        <div className="border-t border-line px-4 py-2 text-center text-[12px] text-ink-muted">
          Menampilkan {MAX_ROWS} dari {formatNumber(results.length)} produk — persempit pencarian
          untuk hasil lebih spesifik.
        </div>
      ) : null}
    </section>
  );
}
