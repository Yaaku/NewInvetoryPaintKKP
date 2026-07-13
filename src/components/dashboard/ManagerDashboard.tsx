import Link from "next/link";
import { ArrowUpFromLine, ClipboardList, Package, ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/utils";
import { monthlyStockFlow } from "@/lib/dashboard-metrics";
import KpiCard from "@/components/dashboard/KpiCard";
import LowStockTable from "@/components/dashboard/LowStockTable";
import StockFlowChart from "@/components/dashboard/StockFlowChart";

/** Store-manager view — flow chart plus catalog & procurement focus. */
export default async function ManagerDashboard({ name }: { name: string }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [products, flow, keluarNow, restockCount, poActive] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, sku: true, name: true, unit: true, currentStock: true, minStock: true },
    }),
    monthlyStockFlow(6),
    prisma.stockMovement.findMany({
      where: { type: "OUTBOUND", createdAt: { gte: monthStart } },
      select: { quantity: true },
    }),
    prisma.product.count({
      where: { isActive: true, currentStock: { lte: prisma.product.fields.minStock } },
    }),
    prisma.purchaseOrder.count({ where: { status: { in: ["draft", "ordered", "partial"] } } }),
  ]);

  const keluarTotal = keluarNow.reduce((s, m) => s + Math.abs(m.quantity), 0);
  const lowAndOut = products
    .filter((p) => p.currentStock <= p.minStock)
    .sort((a, b) => a.currentStock - b.currentStock)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
          Selamat datang, {name}
        </h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Ringkasan manajer — pantau arus stok, katalog, dan kebutuhan pengadaan.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Saran Restock"
          value={formatNumber(restockCount)}
          icon={Package}
          tone={restockCount > 0 ? "warn" : "ok"}
          context="produk di bawah minimum"
          href="/reorder"
        />
        <KpiCard
          label="Purchase Order Aktif"
          value={formatNumber(poActive)}
          icon={ShoppingCart}
          context="draft / ordered / partial"
          href="/purchase-orders"
        />
        <KpiCard
          label="Barang Keluar Bulan Ini"
          value={`${formatNumber(keluarTotal)} unit`}
          icon={ArrowUpFromLine}
          context="total pengeluaran"
        />
        <KpiCard
          label="Produk Aktif"
          value={formatNumber(products.length)}
          icon={ClipboardList}
          context="katalog barang"
          href="/products"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="panel xl:col-span-7">
          <header className="panel-header">
            <h2 className="panel-title">Barang Masuk vs Keluar — 6 Bulan Terakhir</h2>
          </header>
          <div className="p-5">
            <StockFlowChart data={flow} />
          </div>
        </section>
        <div className="xl:col-span-5">
          <LowStockTable items={lowAndOut} />
        </div>
      </div>
    </div>
  );
}
