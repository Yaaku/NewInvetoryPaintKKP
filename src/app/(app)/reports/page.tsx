import Link from "next/link";
import { Printer } from "lucide-react";
import { prisma } from "@/lib/db";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  NEAR_EXPIRY_DAYS,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    groupBy?: "category" | "brand" | "rack";
    from?: string;
    to?: string;
  }>;
}) {
  const sp = await searchParams;
  const groupBy = sp.groupBy ?? "category";

  const now = new Date();
  const nearThreshold = new Date();
  nearThreshold.setDate(now.getDate() + NEAR_EXPIRY_DAYS);
  const fromDate = sp.from
    ? new Date(sp.from)
    : new Date(Date.now() - 30 * 86400000);
  const toDate = sp.to ? new Date(sp.to) : new Date();
  toDate.setHours(23, 59, 59);

  const [products, batches, lowProducts, expiryBatches, movements] =
    await Promise.all([
      prisma.product.findMany({ where: { isActive: true } }),
      prisma.batch.findMany({
        where: { quantity: { gt: 0 } },
        include: { product: true },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { supplier: true },
      }),
      prisma.batch.findMany({
        where: { quantity: { gt: 0 }, expiryDate: { lte: nearThreshold } },
        include: { product: true },
        orderBy: { expiryDate: "asc" },
      }),
      prisma.stockMovement.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        include: { product: true },
      }),
    ]);

  // Stock by group
  const groups = new Map<
    string,
    { qty: number; value: number; lines: number }
  >();
  for (const p of products) {
    const key =
      groupBy === "category"
        ? (p.category ?? "—")
        : groupBy === "brand"
          ? (p.brand ?? "—")
          : (p.rackLocation ?? "—");
    const cur = groups.get(key) ?? { qty: 0, value: 0, lines: 0 };
    cur.qty += p.currentStock;
    cur.value += p.currentStock * (p.purchasePrice || 0);
    cur.lines += 1;
    groups.set(key, cur);
  }
  const groupRows = Array.from(groups.entries()).sort(
    (a, b) => b[1].value - a[1].value,
  );
  const totalValue = products.reduce(
    (s, p) => s + p.currentStock * (p.purchasePrice || 0),
    0,
  );

  // Low stock report
  const lowStock = lowProducts.filter((p) => p.currentStock <= p.minStock);

  // Movements in / out
  const inMoves = movements.filter((m) => m.type === "INBOUND");
  const outMoves = movements.filter((m) => m.type === "OUTBOUND");
  const inQty = inMoves.reduce((s, m) => s + m.quantity, 0);
  const outQty = outMoves.reduce((s, m) => s + Math.abs(m.quantity), 0);

  // Fast / slow moving (by outbound sum)
  const productOutTotals = new Map<number, number>();
  for (const m of outMoves) {
    productOutTotals.set(
      m.productId,
      (productOutTotals.get(m.productId) ?? 0) + Math.abs(m.quantity),
    );
  }
  const ranked = Array.from(productOutTotals.entries())
    .map(([pid, qty]) => ({ product: products.find((p) => p.id === pid), qty }))
    .filter((x) => x.product)
    .sort((a, b) => b.qty - a.qty);
  const fast = ranked.slice(0, 10);
  const slow = ranked.slice(-10).reverse();
  const noMovement = products
    .filter((p) => !productOutTotals.has(p.id))
    .slice(0, 20);

  // Problem stock
  const problemMovements = movements.filter((m) =>
    ["damaged", "leaking", "expired", "return-supplier"].includes(m.reason),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-sans">Laporan</h1>
        <p className="text-body-sm font-sans text-on-surface-variant">
          Periode: {formatDate(fromDate)} → {formatDate(toDate)}
        </p>
      </div>

      <form className="card flex flex-wrap items-end gap-3 p-3">
        <div>
          <label className="label">Dari</label>
          <input
            name="from"
            type="date"
            defaultValue={sp.from ?? fromDate.toISOString().slice(0, 10)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Sampai</label>
          <input
            name="to"
            type="date"
            defaultValue={sp.to ?? toDate.toISOString().slice(0, 10)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Kelompokkan stok berdasarkan</label>
          <select name="groupBy" defaultValue={groupBy} className="input">
            <option value="category">Kategori</option>
            <option value="brand">Brand</option>
            <option value="rack">Rak</option>
          </select>
        </div>
        <button type="submit" className="btn">
          Terapkan
        </button>
        <Link href="/reports" className="btn-secondary">
          Reset
        </Link>
        <div className="flex w-full flex-wrap gap-2 border-t border-line pt-3">
          <PresetLink
            href={`/reports?from=${isoDate(new Date())}&to=${isoDate(new Date())}&groupBy=${groupBy}`}
            label="Hari ini"
          />
          <PresetLink
            href={`/reports?from=${isoDate(daysAgo(7))}&to=${isoDate(new Date())}&groupBy=${groupBy}`}
            label="7 hari"
          />
          <PresetLink
            href={`/reports?from=${isoDate(daysAgo(30))}&to=${isoDate(new Date())}&groupBy=${groupBy}`}
            label="30 hari"
          />
          <PresetLink
            href={`/reports?from=${isoDate(new Date(now.getFullYear(), now.getMonth(), 1))}&to=${isoDate(new Date())}&groupBy=${groupBy}`}
            label="Bulan ini"
          />
        </div>
      </form>

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
          <Printer className="h-4 w-4" /> Cetak Laporan (PDF)
        </span>
        <PrintLink jenis="masuk" label="Laporan Barang Masuk" from={fromDate} to={toDate} />
        <PrintLink jenis="keluar" label="Laporan Barang Keluar" from={fromDate} to={toDate} />
        <PrintLink jenis="kartu" label="Laporan Kartu Stok" from={fromDate} to={toDate} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Nilai Inventaris" value={formatCurrency(totalValue)} />
        <Stat label="Produk Aktif" value={formatNumber(products.length)} />
        <Stat label="Stok Masuk" value={`${formatNumber(inQty)} unit`} />
        <Stat label="Stok Keluar" value={`${formatNumber(outQty)} unit`} />
      </div>

      <Section title={`Stok berdasarkan ${groupLabel(groupBy)}`}>
        <table className="tbl">
          <thead>
            <tr>
              <th>{groupLabel(groupBy)}</th>
              <th className="text-right">Produk</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Nilai</th>
            </tr>
          </thead>
          <tbody>
            {groupRows.map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td className="text-right font-mono">{v.lines}</td>
                <td className="text-right font-mono">{formatNumber(v.qty)}</td>
                <td className="text-right font-mono">
                  {formatCurrency(v.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={`Stok Menipis / Habis (${lowStock.length})`}>
          {lowStock.length === 0 ? (
            <Empty />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Supplier</th>
                  <th>Lead</th>
                  <th className="text-right">Stok / Min</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.slice(0, 30).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        href={`/products/${p.id}`}
                        className="hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td>{p.supplier?.name ?? "—"}</td>
                    <td className="font-mono text-xs">
                      {p.supplier?.leadTimeDays ?? "—"}d
                    </td>
                    <td className="text-right font-mono">
                      {p.currentStock} / {p.minStock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section
          title={`Batch Kedaluwarsa / Hampir Kedaluwarsa (${expiryBatches.length})`}
        >
          {expiryBatches.length === 0 ? (
            <Empty />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Batch</th>
                  <th className="text-right">Qty</th>
                  <th>Kedaluwarsa</th>
                </tr>
              </thead>
              <tbody>
                {expiryBatches.slice(0, 30).map((b) => {
                  const expired = b.expiryDate && b.expiryDate < new Date();
                  return (
                    <tr key={b.id}>
                      <td>{b.product.name}</td>
                      <td className="font-mono text-xs">{b.batchNumber}</td>
                      <td className="text-right font-mono">{b.quantity}</td>
                      <td className={expired ? "text-danger" : "text-warn"}>
                        {formatDate(b.expiryDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Top 10 Produk Cepat Bergerak">
          {fast.length === 0 ? (
            <Empty />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th className="text-right">Qty Keluar</th>
                </tr>
              </thead>
              <tbody>
                {fast.map((r) => (
                  <tr key={r.product!.id}>
                    <td>
                      <Link
                        href={`/products/${r.product!.id}`}
                        className="hover:underline"
                      >
                        {r.product!.name}
                      </Link>
                    </td>
                    <td className="text-right font-mono">{r.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Produk Lambat Bergerak (periode ini)">
          {noMovement.length === 0 && slow.length === 0 ? (
            <Empty />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th className="text-right">Qty Keluar</th>
                </tr>
              </thead>
              <tbody>
                {slow.map((r) => (
                  <tr key={r.product!.id}>
                    <td>{r.product!.name}</td>
                    <td className="text-right font-mono">{r.qty}</td>
                  </tr>
                ))}
                {noMovement.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="text-right font-mono text-ink-soft/50">0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section
          title={`Pergerakan Stok Bermasalah (${problemMovements.length})`}
        >
          {problemMovements.length === 0 ? (
            <Empty />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Produk</th>
                  <th>Alasan</th>
                  <th className="text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {problemMovements.slice(0, 30).map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono text-xs">
                      {formatDate(m.createdAt)}
                    </td>
                    <td>{m.product.name}</td>
                    <td className="text-xs">{m.reason}</td>
                    <td className="text-right font-mono text-danger">
                      {m.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>
    </div>
  );
}

function PrintLink({
  jenis,
  label,
  from,
  to,
}: {
  jenis: string;
  label: string;
  from: Date;
  to: Date;
}) {
  return (
    <Link
      href={`/reports/print?jenis=${jenis}&from=${isoDate(from)}&to=${isoDate(to)}`}
      className="btn-secondary btn-sm"
    >
      {label}
    </Link>
  );
}

function PresetLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="badge badge-info transition hover:border-accent hover:bg-accent hover:text-white"
    >
      {label}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
        {title}
      </h2>
      <div className="table-wrap !border-0 !shadow-none">{children}</div>
    </div>
  );
}

function groupLabel(groupBy: "category" | "brand" | "rack") {
  if (groupBy === "category") return "Kategori";
  if (groupBy === "brand") return "Brand";
  return "Rak";
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function Empty() {
  return <div className="empty-state">Tidak ada data untuk periode ini.</div>;
}
