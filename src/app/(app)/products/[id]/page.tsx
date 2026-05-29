import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate, formatDateTime, daysUntil } from "@/lib/utils";
import { toggleProductActive, deleteProduct } from "../actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const [product, batches, movements] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId }, include: { supplier: true } }),
    prisma.batch.findMany({
      where: { productId },
      orderBy: [{ expiryDate: "asc" }, { receivedDate: "asc" }],
    }),
    prisma.stockMovement.findMany({
      where: { productId },
      include: { batch: true, user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  if (!product) notFound();

  const movementCount = await prisma.stockMovement.count({ where: { productId } });
  const out = product.currentStock <= 0;
  const low = !out && product.currentStock <= product.minStock;
  const user = await getCurrentUser();
  const canManage = can(user?.role, "catalog.manage");
  const canDelete = can(user?.role, "catalog.delete");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-soft/60">
            <Link href="/products" className="hover:underline">Products</Link> · {product.sku}
          </div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{product.name}</h1>
          <div className="mt-1 flex flex-wrap gap-2">
            {!product.isActive ? <span className="badge badge-muted">Inactive</span> : null}
            {out ? <span className="badge badge-danger">Out of stock</span> : null}
            {low ? <span className="badge badge-warn">Low stock</span> : null}
            {product.colorName ? <span className="badge">{product.colorName}{product.colorCode ? ` · ${product.colorCode}` : ""}</span> : null}
            {product.packageSize ? <span className="badge">{product.packageSize}</span> : null}
            {product.tintBase && product.tintBase !== "n/a" ? <span className="badge">{product.tintBase}</span> : null}
          </div>
        </div>
        <div className="flex gap-2">
          {canManage ? (
            <Link href={`/products/${product.id}/edit`} className="btn-secondary">Edit</Link>
          ) : null}
          {canManage ? (
            <form action={toggleProductActive.bind(null, product.id)}>
              <ConfirmSubmit
                className="btn-secondary"
                message={
                  product.isActive
                    ? `Nonaktifkan "${product.name}"? Produk tidak akan muncul di transaksi.`
                    : `Aktifkan kembali "${product.name}"?`
                }
              >
                {product.isActive ? "Nonaktifkan" : "Aktifkan"}
              </ConfirmSubmit>
            </form>
          ) : null}
          {canDelete && movementCount === 0 ? (
            <form action={deleteProduct.bind(null, product.id)}>
              <ConfirmSubmit
                className="btn-danger"
                message={`Hapus permanen "${product.name}"? Tindakan ini tidak dapat dibatalkan.`}
              >
                Hapus
              </ConfirmSubmit>
            </form>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="stat"><div className="stat-label">Current Stock</div><div className="stat-value">{product.currentStock} {product.unit}</div></div>
        <div className="stat"><div className="stat-label">Minimum Stock</div><div className="stat-value">{product.minStock}</div></div>
        <div className="stat"><div className="stat-label">Purchase Price</div><div className="stat-value">{formatCurrency(product.purchasePrice)}</div></div>
        <div className="stat"><div className="stat-label">Selling Price</div><div className="stat-value">{formatCurrency(product.sellingPrice)}</div></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">Details</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Category" value={product.category} />
            <Detail label="Brand" value={product.brand} />
            <Detail label="Paint Type" value={product.paintType} />
            <Detail label="Finish" value={product.finishType} />
            <Detail label="Rack Location" value={product.rackLocation} />
            <Detail label="Supplier" value={product.supplier?.name} />
            <Detail label="Created" value={formatDate(product.createdAt)} />
            <Detail label="Updated" value={formatDate(product.updatedAt)} />
          </dl>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">Batches</h2>
          {batches.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-soft/50">No batches recorded yet.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr><th>Batch</th><th>Qty</th><th>Received</th><th>Expires</th><th>Cost</th></tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const d = daysUntil(b.expiryDate);
                  return (
                    <tr key={b.id}>
                      <td className="font-mono text-xs">{b.batchNumber}</td>
                      <td className="font-mono">{b.quantity}</td>
                      <td>{formatDate(b.receivedDate)}</td>
                      <td>
                        {b.expiryDate ? (
                          <span className={d !== null && d < 0 ? "text-danger" : d !== null && d < 60 ? "text-warn" : ""}>
                            {formatDate(b.expiryDate)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="font-mono">{formatCurrency(b.unitCost)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">Recent Movements</h2>
        {movements.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-soft/50">No movements yet.</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th><th>Type</th><th>Reason</th><th>Batch</th><th className="text-right">Qty</th><th className="text-right">Before → After</th><th>User</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono text-xs">{formatDateTime(m.createdAt)}</td>
                  <td><span className="badge">{m.type}</span></td>
                  <td className="text-xs">{m.reason}</td>
                  <td className="font-mono text-xs">{m.batch?.batchNumber ?? "—"}</td>
                  <td className={`text-right font-mono ${m.quantity < 0 ? "text-danger" : "text-accent"}`}>
                    {m.quantity > 0 ? "+" : ""}{m.quantity}
                  </td>
                  <td className="text-right font-mono text-xs">{m.stockBefore} → {m.stockAfter}</td>
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

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <>
      <dt className="text-[10px] uppercase tracking-widest text-ink-soft/60">{label}</dt>
      <dd className="font-mono">{value || "—"}</dd>
    </>
  );
}
