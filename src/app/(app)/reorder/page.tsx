import Link from "next/link";
import { ShoppingCart, Truck, PackageX, AlertTriangle, Clock, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { createPoFromReorder } from "@/app/(app)/purchase-orders/actions";

export const dynamic = "force-dynamic";

/** Suggested reorder quantity: top the product back up to 2× its minimum. */
function suggestQty(currentStock: number, minStock: number) {
  const target = Math.max(minStock * 2, minStock + 1);
  return Math.max(target - currentStock, 1);
}

export default async function ReorderPage() {
  // Active products at or below their minimum (out + low), via DB field reference.
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      currentStock: { lte: prisma.product.fields.minStock },
    },
    include: { supplier: true },
    orderBy: [{ currentStock: "asc" }, { name: "asc" }],
  });

  // Group by supplier
  type Row = (typeof products)[number] & { suggested: number; estCost: number };
  const groups = new Map<
    string,
    { supplierId: number | null; name: string; leadTime: number | null; rows: Row[]; total: number }
  >();

  for (const p of products) {
    const suggested = suggestQty(p.currentStock, p.minStock);
    const estCost = suggested * (p.purchasePrice || 0);
    const key = p.supplier?.name ?? "Tanpa Supplier";
    const g = groups.get(key) ?? {
      supplierId: p.supplier?.id ?? null,
      name: key,
      leadTime: p.supplier?.leadTimeDays ?? null,
      rows: [],
      total: 0,
    };
    g.rows.push({ ...p, suggested, estCost });
    g.total += estCost;
    groups.set(key, g);
  }

  const supplierGroups = [...groups.values()].sort((a, b) => b.total - a.total);
  const outCount = products.filter((p) => p.currentStock <= 0).length;
  const lowCount = products.length - outCount;
  const grandTotal = supplierGroups.reduce((s, g) => s + g.total, 0);
  const user = await getCurrentUser();
  const canProcure = can(user?.role, "procurement.manage");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-headline-lg font-sans">Saran Restock</h1>
          <p className="text-body-sm font-sans text-on-surface-variant">
            Produk yang sudah mencapai atau di bawah stok minimum, dikelompokkan per supplier.
          </p>
        </div>
      </header>

      {/* Summary chips */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="kpi">
          <div className="flex items-start justify-between">
            <div className="text-[11.5px] font-semibold uppercase tracking-widest2 text-ink-muted">Perlu Restock</div>
            <div className="grid h-8 w-8 place-items-center rounded-md bg-canvas text-ink-muted"><ShoppingCart className="h-[15px] w-[15px]" /></div>
          </div>
          <div className="mt-3 text-[28px] font-bold leading-none">{formatNumber(products.length)}</div>
        </div>
        <div className="kpi-danger">
          <div className="flex items-start justify-between">
            <div className="text-[11.5px] font-semibold uppercase tracking-widest2 text-danger-text">Stok Habis</div>
            <div className="grid h-8 w-8 place-items-center rounded-md bg-danger-softer text-danger-text"><PackageX className="h-[15px] w-[15px]" /></div>
          </div>
          <div className="mt-3 text-[28px] font-bold leading-none text-danger-textStrong">{formatNumber(outCount)}</div>
        </div>
        <div className="kpi-warn">
          <div className="flex items-start justify-between">
            <div className="text-[11.5px] font-semibold uppercase tracking-widest2 text-warn-text">Stok Menipis</div>
            <div className="grid h-8 w-8 place-items-center rounded-md bg-warn-softer text-warn-text"><AlertTriangle className="h-[15px] w-[15px]" /></div>
          </div>
          <div className="mt-3 text-[28px] font-bold leading-none text-warn-textStrong">{formatNumber(lowCount)}</div>
        </div>
        <div className="kpi">
          <div className="flex items-start justify-between">
            <div className="text-[11.5px] font-semibold uppercase tracking-widest2 text-ink-muted">Estimasi Nilai PO</div>
            <div className="grid h-8 w-8 place-items-center rounded-md bg-canvas text-ink-muted"><Truck className="h-[15px] w-[15px]" /></div>
          </div>
          <div className="mt-3 text-[22px] font-bold leading-none">{formatCurrency(grandTotal)}</div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="panel p-12 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-ok-bg text-ok-text">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <p className="text-[15px] font-semibold text-ink">Semua stok aman</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            Tidak ada produk yang berada di bawah stok minimum saat ini.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {supplierGroups.map((g) => (
            <section key={g.name} className="panel">
              <header className="panel-header">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-md bg-canvas text-ink-muted">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="panel-title">
                      {g.supplierId ? (
                        <Link href={`/suppliers/${g.supplierId}`} className="hover:underline">
                          {g.name}
                        </Link>
                      ) : (
                        g.name
                      )}
                    </h2>
                    <div className="flex items-center gap-1 text-[11.5px] text-ink-muted">
                      <Clock className="h-3 w-3" />
                      {g.leadTime != null ? `Lead time ${g.leadTime} hari` : "Lead time —"}
                      <span className="text-ink-faint">•</span>
                      {g.rows.length} item
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10.5px] font-semibold uppercase tracking-widest2 text-ink-muted">Estimasi PO</div>
                    <div className="text-[15px] font-bold text-ink">{formatCurrency(g.total)}</div>
                  </div>
                  {canProcure && g.supplierId ? (
                    <form action={createPoFromReorder.bind(null, g.supplierId)}>
                      <button type="submit" className="btn btn-sm">
                        <ClipboardList className="h-3.5 w-3.5" /> Buat PO
                      </button>
                    </form>
                  ) : null}
                </div>
              </header>

              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>SKU / Produk</th>
                      <th className="text-right">Stok</th>
                      <th className="text-right">Min</th>
                      <th>Status</th>
                      <th className="text-right">Saran Qty</th>
                      <th className="text-right">Estimasi Biaya</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((p) => {
                      const out = p.currentStock <= 0;
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="mono text-[12px] font-semibold uppercase text-ink-soft">{p.sku}</div>
                            <Link href={`/products/${p.id}`} className="text-[13.5px] font-medium text-ink hover:underline">
                              {p.name}
                            </Link>
                          </td>
                          <td className={`mono text-right text-[14px] font-semibold ${out ? "text-danger-text" : "text-warn-text"}`}>
                            {p.currentStock}{p.unit}
                          </td>
                          <td className="mono text-right text-[13px] text-ink-muted">{p.minStock}{p.unit}</td>
                          <td>
                            {out ? <span className="pill-danger">Habis</span> : <span className="pill-warn">Menipis</span>}
                          </td>
                          <td className="mono text-right text-[14px] font-bold text-accent">+{p.suggested}{p.unit}</td>
                          <td className="mono text-right text-[13px] text-ink-soft">{formatCurrency(p.estCost)}</td>
                          <td className="text-right">
                            <Link href={`/stock-in?productId=${p.id}`} className={out ? "btn btn-sm" : "btn-secondary btn-sm"}>
                              Restock
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
