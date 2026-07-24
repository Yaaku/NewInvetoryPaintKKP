import { prisma } from "@/lib/db";
import StockOutForm from "./StockOutForm";

export const dynamic = "force-dynamic";

const OUTBOUND_REASONS = [
  "sale",
  "return-supplier",
  "damaged",
  "leaking",
  "expired",
  "sample",
  "stock-correction",
  "transfer-out",
  "tinting-usage",
];

export default async function StockOutPage() {
  const [products, recent] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, currentStock: { gt: 0 } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unit: true, currentStock: true, colorName: true, packageSize: true },
    }),
    prisma.stockMovement.findMany({
      where: { type: "OUTBOUND" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { product: true, batch: true, user: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-sans">Stok Keluar</h1>
        <p className="text-body-sm font-sans text-on-surface-variant">
          Kurangi stok — penjualan, retur ke supplier, rusak, sampel, transfer, atau pemakaian tinting.
        </p>
      </div>

      <StockOutForm products={products} reasons={OUTBOUND_REASONS} />

      <div className="card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
          Recent Outbound
        </h2>
        {recent.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-soft/50">No outbound yet.</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>When</th><th>Product</th><th>Batch</th><th className="text-right">Qty</th><th>Reason</th><th>By</th></tr></thead>
            <tbody>
              {recent.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono text-xs">{m.createdAt.toLocaleString("en-GB")}</td>
                  <td>{m.product.name}</td>
                  <td className="font-mono text-xs">{m.batch?.batchNumber ?? "—"}</td>
                  <td className="text-right font-mono text-danger-text">{m.quantity}</td>
                  <td className="text-xs">{m.reason}</td>
                  <td className="text-xs">{m.user.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
