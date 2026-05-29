import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber, NEAR_EXPIRY_DAYS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ groupBy?: "category" | "brand" | "rack"; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const groupBy = sp.groupBy ?? "category";

  const now = new Date();
  const nearThreshold = new Date();
  nearThreshold.setDate(now.getDate() + NEAR_EXPIRY_DAYS);
  const fromDate = sp.from ? new Date(sp.from) : new Date(Date.now() - 30 * 86400000);
  const toDate = sp.to ? new Date(sp.to) : new Date();
  toDate.setHours(23, 59, 59);

  const [products, batches, lowProducts, expiryBatches, movements] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true } }),
    prisma.batch.findMany({ where: { quantity: { gt: 0 } }, include: { product: true } }),
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
  const groups = new Map<string, { qty: number; value: number; lines: number }>();
  for (const p of products) {
    const key =
      groupBy === "category" ? p.category ?? "—" :
      groupBy === "brand" ? p.brand ?? "—" :
      p.rackLocation ?? "—";
    const cur = groups.get(key) ?? { qty: 0, value: 0, lines: 0 };
    cur.qty += p.currentStock;
    cur.value += p.currentStock * (p.purchasePrice || 0);
    cur.lines += 1;
    groups.set(key, cur);
  }
  const groupRows = Array.from(groups.entries()).sort((a, b) => b[1].value - a[1].value);
  const totalValue = products.reduce((s, p) => s + p.currentStock * (p.purchasePrice || 0), 0);

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
    productOutTotals.set(m.productId, (productOutTotals.get(m.productId) ?? 0) + Math.abs(m.quantity));
  }
  const ranked = Array.from(productOutTotals.entries())
    .map(([pid, qty]) => ({ product: products.find((p) => p.id === pid), qty }))
    .filter((x) => x.product)
    .sort((a, b) => b.qty - a.qty);
  const fast = ranked.slice(0, 10);
  const slow = ranked.slice(-10).reverse();
  const noMovement = products.filter((p) => !productOutTotals.has(p.id)).slice(0, 20);

  // Problem stock
  const problemMovements = movements.filter((m) =>
    ["damaged", "leaking", "expired", "return-supplier"].includes(m.reason)
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
        <div><label className="label">From</label><input name="from" type="date" defaultValue={sp.from ?? fromDate.toISOString().slice(0, 10)} className="input" /></div>
        <div><label className="label">To</label><input name="to" type="date" defaultValue={sp.to ?? toDate.toISOString().slice(0, 10)} className="input" /></div>
        <div>
          <label className="label">Group stock by</label>
          <select name="groupBy" defaultValue={groupBy} className="input">
            <option value="category">Category</option>
            <option value="brand">Brand</option>
            <option value="rack">Rack</option>
          </select>
        </div>
        <button type="submit" className="btn">Apply</button>
        <Link href="/reports" className="btn-secondary">Reset</Link>
      </form>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Inventory Value" value={formatCurrency(totalValue)} />
        <Stat label="Active Products" value={formatNumber(products.length)} />
        <Stat label="Inbound (window)" value={`${formatNumber(inQty)} units`} />
        <Stat label="Outbound (window)" value={`${formatNumber(outQty)} units`} />
      </div>

      <Section title={`Stock by ${groupBy}`}>
        <table className="tbl">
          <thead><tr><th>{groupBy}</th><th className="text-right">Products</th><th className="text-right">Qty</th><th className="text-right">Value</th></tr></thead>
          <tbody>
            {groupRows.map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td className="text-right font-mono">{v.lines}</td>
                <td className="text-right font-mono">{formatNumber(v.qty)}</td>
                <td className="text-right font-mono">{formatCurrency(v.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={`Low / Out of Stock (${lowStock.length})`}>
          {lowStock.length === 0 ? <Empty /> : (
            <table className="tbl">
              <thead><tr><th>Product</th><th>Supplier</th><th>Lead</th><th className="text-right">Stock / Min</th></tr></thead>
              <tbody>
                {lowStock.slice(0, 30).map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/products/${p.id}`} className="hover:underline">{p.name}</Link></td>
                    <td>{p.supplier?.name ?? "—"}</td>
                    <td className="font-mono text-xs">{p.supplier?.leadTimeDays ?? "—"}d</td>
                    <td className="text-right font-mono">{p.currentStock} / {p.minStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title={`Expired / Near-Expiry Batches (${expiryBatches.length})`}>
          {expiryBatches.length === 0 ? <Empty /> : (
            <table className="tbl">
              <thead><tr><th>Product</th><th>Batch</th><th className="text-right">Qty</th><th>Expires</th></tr></thead>
              <tbody>
                {expiryBatches.slice(0, 30).map((b) => {
                  const expired = b.expiryDate && b.expiryDate < new Date();
                  return (
                    <tr key={b.id}>
                      <td>{b.product.name}</td>
                      <td className="font-mono text-xs">{b.batchNumber}</td>
                      <td className="text-right font-mono">{b.quantity}</td>
                      <td className={expired ? "text-danger" : "text-warn"}>{formatDate(b.expiryDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Top 10 Fast-Moving">
          {fast.length === 0 ? <Empty /> : (
            <table className="tbl">
              <thead><tr><th>Product</th><th className="text-right">Out Qty</th></tr></thead>
              <tbody>
                {fast.map((r) => (
                  <tr key={r.product!.id}>
                    <td><Link href={`/products/${r.product!.id}`} className="hover:underline">{r.product!.name}</Link></td>
                    <td className="text-right font-mono">{r.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Slow Movers (in window)">
          {noMovement.length === 0 && slow.length === 0 ? <Empty /> : (
            <table className="tbl">
              <thead><tr><th>Product</th><th className="text-right">Out Qty</th></tr></thead>
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

        <Section title={`Problem Stock Movements (${problemMovements.length})`}>
          {problemMovements.length === 0 ? <Empty /> : (
            <table className="tbl">
              <thead><tr><th>Date</th><th>Product</th><th>Reason</th><th className="text-right">Qty</th></tr></thead>
              <tbody>
                {problemMovements.slice(0, 30).map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono text-xs">{formatDate(m.createdAt)}</td>
                    <td>{m.product.name}</td>
                    <td className="text-xs">{m.reason}</td>
                    <td className="text-right font-mono text-danger">{m.quantity}</td>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">{title}</h2>
      <div className="table-wrap !border-0 !shadow-none">{children}</div>
    </div>
  );
}

function Empty() {
  return <div className="py-6 text-center text-xs text-ink-soft/50">No data.</div>;
}
