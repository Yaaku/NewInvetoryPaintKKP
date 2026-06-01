import Link from "next/link";
import { PackageX } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

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
              <th>Level Stok</th>
              <th className="text-center">Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-[13px] text-ink-muted">
                  Semua produk berada di atas stok minimum.
                </td>
              </tr>
            ) : (
              items.map((p) => {
                const out = p.currentStock <= 0;
                return (
                  <tr key={p.id}>
                    <td className="py-3">
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
                    <td className="min-w-[220px] py-3 pr-4">
                      <StockIndicator current={p.currentStock} min={p.minStock} unit={p.unit} />
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

function StockIndicator({
  current,
  min,
  unit,
}: {
  current: number;
  min: number;
  unit: string;
}) {
  const out = current <= 0;
  const low = !out && current <= min;
  const tone = out ? "danger" : low ? "warn" : "ok";
  const dotTone = out ? "bg-danger-solid" : low ? "bg-warn-solid" : "bg-ok-solid";
  const barTone = out
    ? "bg-danger-solid"
    : low
    ? "bg-warn-solid"
    : "bg-ok-solid";

  // Scale the bar to min*2 so the minimum sits at the 50% mark visually,
  // giving a clear sense of how far above/below the threshold the stock is.
  const safeMin = Math.max(min, 1);
  const max = Math.max(safeMin * 2, current);
  const pct = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
  const minPct = Math.max(0, Math.min(100, Math.round((safeMin / max) * 100)));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-block h-1.5 w-1.5 rounded-full", dotTone)} aria-hidden />
          <span className="text-ink-muted">Stok</span>
          <span
            className={cn(
              "mono font-bold",
              out ? "text-danger-text" : low ? "text-warn-textStrong" : "text-ok-text"
            )}
          >
            {formatNumber(current)}{unit}
          </span>
        </div>
        <span className="text-ink-faint">/</span>
        <div className="flex items-center gap-1.5">
          <span className="text-ink-muted">Minimum</span>
          <span className="mono font-semibold text-ink-soft">
            {formatNumber(safeMin)}{unit}
          </span>
        </div>
        <span
          className={cn(
            "ml-auto inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider",
            tone === "danger" && "border-danger-border bg-danger-bg text-danger-text",
            tone === "warn" && "border-warn-border bg-warn-bg text-warn-text",
            tone === "ok" && "border-ok-border bg-ok-bg text-ok-text"
          )}
        >
          {out ? "Habis" : low ? "Menipis" : "Sehat"}
        </span>
      </div>
      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-label={`Stok ${current} dari ${safeMin} minimum`}
      >
        <div
          className={cn("h-full rounded-full transition-all", barTone)}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 h-full w-px bg-ink-subtle/60"
          style={{ left: `${minPct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
