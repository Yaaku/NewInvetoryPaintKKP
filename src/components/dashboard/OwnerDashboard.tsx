import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, Banknote, FileText, Package } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/utils";
import { compactRupiah, monthlyStockFlow } from "@/lib/dashboard-metrics";
import KpiCard from "@/components/dashboard/KpiCard";
import StockFlowChart from "@/components/dashboard/StockFlowChart";

/** Executive overview for Pemilik — reports & charts, read-only oversight. */
export default async function OwnerDashboard({ name }: { name: string }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [products, monthMoves, prevMonthMoves, flow, topOut] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { currentStock: true, minStock: true, purchasePrice: true },
    }),
    prisma.stockMovement.findMany({
      where: { createdAt: { gte: monthStart }, type: { in: ["INBOUND", "OUTBOUND"] } },
      select: { type: true, quantity: true },
    }),
    prisma.stockMovement.findMany({
      where: {
        createdAt: { gte: prevMonthStart, lt: monthStart },
        type: { in: ["INBOUND", "OUTBOUND"] },
      },
      select: { type: true, quantity: true },
    }),
    monthlyStockFlow(6),
    prisma.stockMovement.groupBy({
      by: ["productId"],
      where: { type: "OUTBOUND", createdAt: { gte: monthStart } },
      _sum: { quantity: true },
    }),
  ]);

  const sum = (moves: typeof monthMoves, type: "INBOUND" | "OUTBOUND") =>
    moves.filter((m) => m.type === type).reduce((s, m) => s + Math.abs(m.quantity), 0);

  const masukNow = sum(monthMoves, "INBOUND");
  const keluarNow = sum(monthMoves, "OUTBOUND");
  const masukPrev = sum(prevMonthMoves, "INBOUND");
  const keluarPrev = sum(prevMonthMoves, "OUTBOUND");

  const delta = (curV: number, prevV: number) =>
    prevV === 0 ? (curV > 0 ? 1 : 0) : (curV - prevV) / prevV;

  const inventoryValue = products.reduce(
    (s, p) => s + p.currentStock * (p.purchasePrice || 0),
    0
  );
  const lowCount = products.filter((p) => p.currentStock <= p.minStock).length;

  // Resolve top outbound products for the "produk terlaris" table
  const topIds = topOut
    .map((r) => ({ id: r.productId, qty: Math.abs(r._sum.quantity ?? 0) }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const topProducts = await prisma.product.findMany({
    where: { id: { in: topIds.map((t) => t.id) } },
    select: { id: true, name: true, sku: true, unit: true },
  });
  const topRows = topIds
    .map((t) => ({ ...t, product: topProducts.find((p) => p.id === t.id) }))
    .filter((t) => t.product);

  const monthLabel = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
            Selamat datang, {name}
          </h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            Ringkasan pemilik — arus barang masuk &amp; keluar dan nilai persediaan · {monthLabel}
          </p>
        </div>
        <Link href="/reports" className="btn-secondary">
          <FileText className="h-4 w-4" /> Lihat Laporan Lengkap
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Barang Masuk Bulan Ini"
          value={`${formatNumber(masukNow)} unit`}
          icon={ArrowDownToLine}
          tone="ok"
          delta={delta(masukNow, masukPrev)}
          context="vs bulan lalu"
        />
        <KpiCard
          label="Barang Keluar Bulan Ini"
          value={`${formatNumber(keluarNow)} unit`}
          icon={ArrowUpFromLine}
          tone="warn"
          delta={delta(keluarNow, keluarPrev)}
          context="vs bulan lalu"
        />
        <KpiCard
          label="Nilai Persediaan"
          value={compactRupiah(inventoryValue)}
          icon={Banknote}
          context="berdasarkan harga beli"
          href="/reports"
        />
        <KpiCard
          label="Produk Aktif"
          value={formatNumber(products.length)}
          icon={Package}
          context={`${formatNumber(lowCount)} perlu restock`}
          href="/products"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="panel xl:col-span-8">
          <header className="panel-header">
            <h2 className="panel-title">Barang Masuk vs Keluar — 6 Bulan Terakhir</h2>
          </header>
          <div className="p-5">
            <StockFlowChart data={flow} />
          </div>
        </section>

        <section className="panel xl:col-span-4">
          <header className="panel-header">
            <h2 className="panel-title">Produk Terlaris Bulan Ini</h2>
            <Link href="/reports" className="panel-action">
              Detail
            </Link>
          </header>
          <div className="p-2">
            {topRows.length === 0 ? (
              <div className="px-3 py-10 text-center text-[13px] text-ink-muted">
                Belum ada barang keluar bulan ini.
              </div>
            ) : (
              <ol className="divide-y divide-line">
                {topRows.map((t, i) => (
                  <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-canvas text-[12px] font-bold text-ink-muted">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium text-ink">
                        {t.product!.name}
                      </div>
                      <div className="mono text-[11px] uppercase text-ink-subtle">
                        {t.product!.sku}
                      </div>
                    </div>
                    <span className="mono text-[13px] font-semibold text-warn-text">
                      {formatNumber(t.qty)} {t.product!.unit}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
