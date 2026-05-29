import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { markOrdered, cancelPurchaseOrder, receivePurchaseOrder } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", ordered: "Dipesan", partial: "Diterima Sebagian", received: "Diterima", cancelled: "Dibatalkan",
};
const STATUS_BADGE: Record<string, string> = {
  draft: "badge-muted", ordered: "badge-warn", partial: "badge-info", received: "badge-ok", cancelled: "badge-danger",
};

export default async function PurchaseOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCapability("procurement.manage");
  const { id } = await params;
  const poId = Number(id);
  if (!Number.isFinite(poId)) notFound();

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { supplier: true, user: true, items: { include: { product: true } } },
  });
  if (!po) notFound();

  const total = po.items.reduce((s, i) => s + i.quantityOrdered * i.unitCost, 0);
  const canReceive = ["draft", "ordered", "partial"].includes(po.status);
  const canEdit = canReceive;
  const outstandingTotal = po.items.reduce(
    (s, i) => s + Math.max(i.quantityOrdered - i.quantityReceived, 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest2 text-ink-muted">
            <Link href="/purchase-orders" className="hover:underline">Purchase Order</Link>
          </div>
          <h1 className="text-headline-lg font-sans tracking-tight">PO #{po.id}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`badge ${STATUS_BADGE[po.status]}`}>{STATUS_LABEL[po.status]}</span>
            {po.supplier ? (
              <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-muted">
                <Truck className="h-3.5 w-3.5" /> {po.supplier.name}
                {po.supplier.leadTimeDays ? ` · lead time ${po.supplier.leadTimeDays} hari` : ""}
              </span>
            ) : null}
            {po.expectedDate ? (
              <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-muted">
                <Clock className="h-3.5 w-3.5" /> Perkiraan {formatDate(po.expectedDate)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {po.status === "draft" ? (
            <form action={markOrdered.bind(null, po.id)}>
              <button type="submit" className="btn-secondary">Tandai Dipesan</button>
            </form>
          ) : null}
          {canEdit ? (
            <form action={cancelPurchaseOrder.bind(null, po.id)}>
              <ConfirmSubmit className="btn-secondary" message={`Batalkan PO #${po.id}?`}>
                Batalkan
              </ConfirmSubmit>
            </form>
          ) : null}
        </div>
      </div>

      {/* Items + receive form */}
      <form action={canReceive ? receivePurchaseOrder.bind(null, po.id) : undefined} className="panel overflow-hidden">
        <div className="panel-header">
          <h2 className="panel-title">Item ({po.items.length})</h2>
          <span className="text-[12.5px] text-ink-muted">Dibuat oleh {po.user.name} · {formatDate(po.createdAt)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>SKU / Produk</th>
                <th className="text-right">Dipesan</th>
                <th className="text-right">Diterima</th>
                {canReceive ? <th className="text-right">Sisa</th> : null}
                {canReceive ? <th className="text-right">Terima Sekarang</th> : null}
                <th className="text-right">Harga Satuan</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((it) => {
                const outstanding = Math.max(it.quantityOrdered - it.quantityReceived, 0);
                const done = it.quantityReceived >= it.quantityOrdered;
                return (
                  <tr key={it.id}>
                    <td>
                      <div className="mono text-[12px] font-semibold uppercase text-ink-soft">{it.product.sku}</div>
                      <Link href={`/products/${it.product.id}`} className="text-[13.5px] font-medium text-ink hover:underline">
                        {it.product.name}
                      </Link>
                    </td>
                    <td className="text-right mono">{it.quantityOrdered}{it.product.unit}</td>
                    <td className="text-right mono">
                      <span className={done ? "text-ok-text" : "text-ink-muted"}>
                        {it.quantityReceived}{it.product.unit}
                      </span>
                    </td>
                    {canReceive ? (
                      <td className="text-right mono text-ink-muted">{outstanding}{it.product.unit}</td>
                    ) : null}
                    {canReceive ? (
                      <td className="text-right">
                        <input
                          type="number"
                          name={`recv_${it.id}`}
                          min={0}
                          max={outstanding}
                          defaultValue={outstanding}
                          disabled={outstanding === 0}
                          aria-label={`Jumlah diterima untuk ${it.product.name}`}
                          className="input w-24 text-right disabled:opacity-50"
                        />
                      </td>
                    ) : null}
                    <td className="text-right mono">{formatCurrency(it.unitCost)}</td>
                    <td className="text-right mono">{formatCurrency(it.quantityOrdered * it.unitCost)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={canReceive ? 6 : 4} className="text-right text-[12px] font-semibold uppercase tracking-widest2 text-ink-muted">Total</td>
                <td className="text-right mono text-[15px] font-bold text-ink">{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {canReceive ? (
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line bg-canvas/50 p-4">
            <div>
              <label className="label">No. Faktur / Invoice (opsional)</label>
              <input name="invoiceNumber" className="input w-64" placeholder="INV-2026-..." defaultValue={po.invoiceNumber ?? ""} />
              <p className="mt-1 text-[12px] text-ink-muted">
                Sesuaikan jumlah “Terima Sekarang” untuk penerimaan sebagian. Sisa {outstandingTotal} unit belum diterima.
              </p>
            </div>
            <ConfirmSubmit
              className="btn"
              message={`Terima item PO #${po.id}? Jumlah yang dimasukkan akan masuk ke stok dan membuat batch baru.`}
            >
              Terima → Tambah Stok
            </ConfirmSubmit>
          </div>
        ) : null}
      </form>

      {po.notes ? (
        <div className="panel p-4 text-[13px] text-ink-soft">
          <span className="font-semibold">Catatan: </span>{po.notes}
        </div>
      ) : null}
    </div>
  );
}
