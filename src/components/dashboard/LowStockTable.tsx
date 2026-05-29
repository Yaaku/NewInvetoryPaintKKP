import Link from "next/link";
import { PackageX } from "lucide-react";

type Product = {
  id: number;
  sku: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
};

export default function LowStockTable({ items }: { items: Product[] }) {
  return (
    <section className="panel">
      <header className="panel-header">
        <div className="flex items-center gap-2">
          <PackageX className="h-[16px] w-[16px] text-ink-muted" />
          <h2 className="panel-title">Monitoring Stok Menipis</h2>
        </div>
        <span className="badge badge-warn px-2.5 py-1">
          {items.length} Item di Bawah Minimum
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>SKU / Produk</th>
              <th className="text-right">Stok Saat Ini</th>
              <th className="text-right">Stok Minimum</th>
              <th className="text-center">Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[13px] text-ink-muted">
                  Semua produk berada di atas stok minimum.
                </td>
              </tr>
            ) : (
              items.map((p) => {
                const out = p.currentStock <= 0;
                return (
                  <tr key={p.id}>
                    <td className="py-3.5">
                      <div className="mono text-[12px] font-semibold uppercase text-ink-soft">
                        {p.sku}
                      </div>
                      <Link
                        href={`/products/${p.id}`}
                        className="text-[13.5px] font-medium text-ink hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td
                      className={`mono text-right text-[14px] font-semibold ${
                        out ? "text-danger-text" : "text-warn-text"
                      }`}
                    >
                      {p.currentStock}{p.unit}
                    </td>
                    <td className="mono text-right text-[13px] text-ink-muted">
                      {p.minStock}{p.unit}
                    </td>
                    <td className="text-center">
                      {out ? (
                        <span className="pill-danger">Stok Habis</span>
                      ) : (
                        <span className="pill-warn">Menipis</span>
                      )}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/stock-in?productId=${p.id}`}
                        className={out ? "btn btn-sm" : "btn-secondary btn-sm"}
                      >
                        Restock
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
