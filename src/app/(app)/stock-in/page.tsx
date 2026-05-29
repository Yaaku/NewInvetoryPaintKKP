import { prisma } from "@/lib/db";
import StockInForm from "./StockInForm";

export const dynamic = "force-dynamic";

const INBOUND_REASONS = [
  "purchase",
  "customer-return",
  "stock-correction",
  "transfer-in",
];

export default async function StockInPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const { productId } = await searchParams;
  const [products, suppliers, recent] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, sku: true, unit: true, packageSize: true,
        colorName: true, rackLocation: true, supplierId: true, purchasePrice: true,
      },
    }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.stockMovement.findMany({
      where: { type: "INBOUND" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { product: true, batch: true, user: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-sans">Stok Masuk</h1>
        <p className="text-body-sm font-sans text-on-surface-variant">
          Catat stok masuk — pembelian, retur pelanggan, koreksi, atau transfer masuk.
        </p>
      </div>

      <StockInForm
        products={products}
        suppliers={suppliers}
        reasons={INBOUND_REASONS}
        initialProductId={productId}
      />

      <div className="card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
          Recent Inbound
        </h2>
        {recent.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-soft/50">No inbound yet.</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>When</th><th>Product</th><th>Batch</th><th className="text-right">Qty</th><th>Reason</th><th>By</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono text-xs">{m.createdAt.toLocaleString("en-GB")}</td>
                  <td>{m.product.name}</td>
                  <td className="font-mono text-xs">{m.batch?.batchNumber ?? "—"}</td>
                  <td className="text-right font-mono text-accent">+{m.quantity}</td>
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
