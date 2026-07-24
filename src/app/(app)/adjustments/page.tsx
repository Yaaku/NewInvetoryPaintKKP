import { prisma } from "@/lib/db";
import AdjustmentForm from "./AdjustmentForm";

export const dynamic = "force-dynamic";

const REASONS = [
  "opname-difference",
  "damaged",
  "leaking",
  "wrong-input",
  "missing",
  "expired",
  "other",
];

export default async function AdjustmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const { productId } = await searchParams;
  const [products, recent] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unit: true, currentStock: true, colorName: true, packageSize: true },
    }),
    prisma.stockMovement.findMany({
      where: { type: "ADJUSTMENT" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { product: true, batch: true, user: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-sans">Penyesuaian Stok</h1>
        <p className="text-body-sm font-sans text-on-surface-variant">
          Koreksi selisih stok — alasan dan catatan wajib diisi.
        </p>
      </div>
      <AdjustmentForm products={products} reasons={REASONS} initialProductId={productId} />
      <div className="card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
          Recent Adjustments
        </h2>
        {recent.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-soft/50">No adjustments yet.</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>When</th><th>Product</th><th>Reason</th><th className="text-right">Δ Qty</th><th>Before → After</th><th>Notes</th><th>By</th></tr></thead>
            <tbody>
              {recent.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono text-xs">{m.createdAt.toLocaleString("en-GB")}</td>
                  <td>{m.product.name}</td>
                  <td className="text-xs">{m.reason}</td>
                  <td className={`text-right font-mono ${m.quantity < 0 ? "text-danger-text" : m.quantity > 0 ? "text-accent" : ""}`}>
                    {m.quantity > 0 ? "+" : ""}{m.quantity}
                  </td>
                  <td className="font-mono text-xs">{m.stockBefore} → {m.stockAfter}</td>
                  <td className="text-xs">{m.notes ?? "—"}</td>
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
