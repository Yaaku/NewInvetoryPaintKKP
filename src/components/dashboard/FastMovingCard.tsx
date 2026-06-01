import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpFromLine,
  ChevronRight,
  Droplets,
  Minus,
  TrendingUp,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

type Swatch = { color: string; light?: boolean };

type Row = {
  productId: number;
  name: string;
  sku: string;
  unit: string;
  qty: number;
  delta: number; // 0.12 = +12%
  swatch: Swatch | null;
};

export default function FastMovingCard({ rows }: { rows: Row[] }) {
  return (
    <section className="panel flex h-full flex-col">
      <header className="panel-header">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-[16px] w-[16px] text-ink-muted" />
          <h2 className="panel-title">Produk Paling Laris</h2>
        </div>
      </header>

      <div className="px-5 pt-3 text-[12.5px] text-ink-muted">
        Top 5 berdasarkan stok keluar bulan ini
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-canvas text-ink-muted">
            <TrendingUp className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[13.5px] font-semibold text-ink">
              Belum ada penjualan bulan ini
            </div>
            <div className="mt-0.5 text-[12px] text-ink-muted">
              Catat transaksi stok keluar untuk mulai melihat produk paling laris.
            </div>
          </div>
          <Link
            href="/stock-out"
            className="btn-accent btn-sm mt-1"
          >
            <ArrowUpFromLine className="h-3.5 w-3.5" />
            Catat Stok Keluar
          </Link>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-line">
          {rows.map((r, idx) => {
            const pct = Math.round(r.delta * 100);
            const positive = pct > 0;
            const negative = pct < 0;
            const tone = positive
              ? "text-ok-text bg-ok-bg border-ok-border"
              : negative
              ? "text-danger-text bg-danger-softer border-danger-border"
              : "text-ink-muted bg-canvas border-line";
            const Arrow = positive ? ArrowUp : negative ? ArrowDown : Minus;
            return (
              <li key={r.productId} className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-canvas">
                    {r.swatch ? (
                      <div
                        className="h-6 w-6 rounded-full border shadow-sm"
                        style={{
                          background: r.swatch.color,
                          borderColor: r.swatch.light ? "#d1d5db" : r.swatch.color,
                        }}
                        aria-hidden
                      />
                    ) : (
                      <Droplets className="h-[18px] w-[18px] text-ink-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/products/${r.productId}`}
                        className="truncate text-[13.5px] font-semibold text-ink hover:underline"
                      >
                        {r.name}
                      </Link>
                      {idx === 0 ? (
                        <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-text">
                          #1
                        </span>
                      ) : null}
                    </div>
                    <div className="mono text-[11px] uppercase tracking-wider text-ink-muted">
                      {r.sku}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mono text-[15px] font-bold text-ink">
                      {formatNumber(r.qty)}<span className="text-ink-muted">{r.unit}</span>
                    </div>
                    <div
                      className={`mt-0.5 inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10.5px] font-semibold ${tone}`}
                    >
                      <Arrow className="h-3 w-3" />
                      {positive ? `+${pct}` : pct}%
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/reports"
        className="flex items-center justify-center gap-1 border-t border-line bg-canvas/60 px-5 py-3 text-[12.5px] font-semibold text-accent hover:bg-canvas hover:text-accent-hover"
      >
        Laporan Penjualan Lengkap <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}
