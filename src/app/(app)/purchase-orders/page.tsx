import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  ordered: "Dipesan",
  received: "Diterima",
  cancelled: "Dibatalkan",
};
const STATUS_BADGE: Record<string, string> = {
  draft: "badge-muted",
  ordered: "badge-warn",
  received: "badge-ok",
  cancelled: "badge-danger",
};

export default async function PurchaseOrdersPage() {
  await requireCapability("procurement.manage");

  const orders = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      supplier: true,
      user: true,
      items: { select: { quantityOrdered: true, unitCost: true } },
    },
  });

  const rows = orders.map((po) => {
    const itemCount = po.items.length;
    const total = po.items.reduce((s, i) => s + i.quantityOrdered * i.unitCost, 0);
    return { po, itemCount, total };
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-headline-lg font-sans">Purchase Order</h1>
          <p className="text-body-sm font-sans text-on-surface-variant">
            Buat pesanan pembelian, lalu terima untuk otomatis menambah stok.
          </p>
        </div>
        <Link href="/purchase-orders/new" className="btn">+ PO Baru</Link>
      </header>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>No. PO</th>
              <th>Supplier</th>
              <th className="text-right">Item</th>
              <th className="text-right">Estimasi</th>
              <th>Tgl Dibuat</th>
              <th>Perkiraan Tiba</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[13px] text-ink-muted">
                  Belum ada purchase order.
                </td>
              </tr>
            ) : (
              rows.map(({ po, itemCount, total }) => (
                <tr key={po.id}>
                  <td>
                    <Link href={`/purchase-orders/${po.id}`} className="font-semibold text-ink hover:underline">
                      PO #{po.id}
                    </Link>
                  </td>
                  <td>{po.supplier?.name ?? "—"}</td>
                  <td className="text-right mono">{itemCount}</td>
                  <td className="text-right mono">{formatCurrency(total)}</td>
                  <td className="text-[12.5px] text-ink-muted">{formatDate(po.createdAt)}</td>
                  <td className="text-[12.5px] text-ink-muted">{po.expectedDate ? formatDate(po.expectedDate) : "—"}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[po.status] ?? "badge-muted"}`}>
                      {STATUS_LABEL[po.status] ?? po.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
