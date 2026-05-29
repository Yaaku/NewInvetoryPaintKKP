import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import SupplierForm from "../SupplierForm";
import { toggleSupplierActive } from "../actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function SupplierDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sid = Number(id);
  if (!Number.isFinite(sid)) notFound();

  const supplier = await prisma.supplier.findUnique({
    where: { id: sid },
    include: {
      products: { orderBy: { name: "asc" }, take: 50 },
      batches: { orderBy: { receivedDate: "desc" }, take: 20, include: { product: true } },
    },
  });
  if (!supplier) notFound();

  const user = await getCurrentUser();
  const canManage = can(user?.role, "catalog.manage");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest2 text-ink-muted">
            <Link href="/suppliers" className="hover:underline">Supplier</Link>
          </div>
          <h1 className="text-headline-lg font-sans tracking-tight">{supplier.name}</h1>
        </div>
        {canManage ? (
          <form action={toggleSupplierActive.bind(null, supplier.id)}>
            <ConfirmSubmit
              className="btn-secondary"
              message={
                supplier.isActive
                  ? `Nonaktifkan supplier "${supplier.name}"?`
                  : `Aktifkan kembali supplier "${supplier.name}"?`
              }
            >
              {supplier.isActive ? "Nonaktifkan" : "Aktifkan"}
            </ConfirmSubmit>
          </form>
        ) : null}
      </div>

      <SupplierForm supplier={supplier} readOnly={!canManage} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">Products ({supplier.products.length})</h2>
          {supplier.products.length === 0 ? (
            <div className="py-6 text-center text-xs text-ink-soft/50">No linked products.</div>
          ) : (
            <ul className="divide-y divide-line">
              {supplier.products.map((p) => (
                <li key={p.id} className="py-2 text-sm">
                  <Link href={`/products/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                  <div className="text-[10px] uppercase tracking-widest text-ink-soft/60">{p.sku}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">Recent Batches</h2>
          {supplier.batches.length === 0 ? (
            <div className="py-6 text-center text-xs text-ink-soft/50">No batches received from this supplier.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Date</th><th>Product</th><th>Batch</th><th>Qty</th></tr></thead>
              <tbody>
                {supplier.batches.map((b) => (
                  <tr key={b.id}>
                    <td className="font-mono text-xs">{formatDate(b.receivedDate)}</td>
                    <td>{b.product.name}</td>
                    <td className="font-mono text-xs">{b.batchNumber}</td>
                    <td className="font-mono">{b.initialQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
