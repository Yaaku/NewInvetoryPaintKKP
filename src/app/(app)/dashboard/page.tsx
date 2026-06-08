import { AlertTriangle, Archive, Banknote, Droplets } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatNumber, NEAR_EXPIRY_DAYS } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KpiCard";
import AlertsCard from "@/components/dashboard/AlertsCard";
import LowStockTable from "@/components/dashboard/LowStockTable";
import FastMovingCard from "@/components/dashboard/FastMovingCard";
import RecentActivityCard, {
  type ActivityItem,
} from "@/components/dashboard/RecentActivityCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const nearExpiryThreshold = new Date();
  nearExpiryThreshold.setDate(now.getDate() + NEAR_EXPIRY_DAYS);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = monthStart;

  const [
    totalActive,
    products,
    expiredBatches,
    nearExpiryBatches,
    monthMoves,
    prevMonthMoves,
    recentMovements,
    recentPOs,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.batch.findMany({
      where: { quantity: { gt: 0 }, expiryDate: { lt: now } },
      include: { product: { select: { id: true, name: true, unit: true } } },
      orderBy: { expiryDate: "asc" },
      take: 6,
    }),
    prisma.batch.findMany({
      where: { quantity: { gt: 0 }, expiryDate: { gte: now, lte: nearExpiryThreshold } },
      include: { product: { select: { id: true, name: true, unit: true } },
                 supplier: { select: { id: true, name: true } } },
      orderBy: { expiryDate: "asc" },
      take: 6,
    }),
    prisma.stockMovement.findMany({
      where: { type: "OUTBOUND", createdAt: { gte: monthStart } },
    }),
    prisma.stockMovement.findMany({
      where: { type: "OUTBOUND", createdAt: { gte: prevMonthStart, lt: prevMonthEnd } },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 7,
      include: {
        product: { select: { id: true, name: true, unit: true } },
        batch: { select: { batchNumber: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        supplier: { select: { name: true } },
        user: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const inventoryValue = products.reduce(
    (s, p) => s + p.currentStock * (p.purchasePrice || 0),
    0
  );
  const lowStock = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock);
  const outOfStock = products.filter((p) => p.currentStock <= 0);
  const inStockCount = products.filter((p) => p.currentStock > 0).length;
  const lowAndOut = [...outOfStock, ...lowStock].slice(0, 6);

  const sumByProduct = (moves: typeof monthMoves) => {
    const m = new Map<number, number>();
    for (const x of moves) m.set(x.productId, (m.get(x.productId) ?? 0) + Math.abs(x.quantity));
    return m;
  };
  const cur = sumByProduct(monthMoves);
  const prev = sumByProduct(prevMonthMoves);
  const fastIds = [...cur.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const fastRows = fastIds
    .map(([pid, qty]) => {
      const p = products.find((x) => x.id === pid);
      if (!p) return null;
      const before = prev.get(pid) ?? 0;
      const delta = before === 0 ? (qty > 0 ? 1 : 0) : (qty - before) / before;
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        qty,
        delta,
        swatch: swatchFor(p.colorName, p.colorCode, p.paintType),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // KPI trend signals
  const curOutboundTotal = monthMoves.reduce((s, x) => s + Math.abs(x.quantity), 0);
  const prevOutboundTotal = prevMonthMoves.reduce((s, x) => s + Math.abs(x.quantity), 0);
  const outboundDelta =
    prevOutboundTotal === 0
      ? curOutboundTotal > 0
        ? 1
        : 0
      : (curOutboundTotal - prevOutboundTotal) / prevOutboundTotal;

  // Inventory value snapshot from last month: we approximate by re-summing each product's
  // outbound-from-this-month delta. Without a stock history table we use outbound velocity
  // as a proxy: prevValue = currentValue + (curOutbound - prevOutbound) * avg price.
  // Keep this conservative: show the month-over-month movement of units moved, not the value.
  const totalAttention = lowStock.length + outOfStock.length + expiredBatches.length;

  // Merge + sort activities (newest first), then trim to 10.
  const movementItems: ActivityItem[] = recentMovements.map((m) => ({
    kind: "movement" as const,
    id: m.id,
    type: m.type as "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TINTING",
    reason: m.reason,
    quantity: m.quantity,
    productName: m.product.name,
    productId: m.product.id,
    productUnit: m.product.unit,
    batchNumber: m.batch?.batchNumber ?? null,
    userName: m.user.name,
    createdAt: m.createdAt,
  }));
  const poItems: ActivityItem[] = recentPOs.map((p) => ({
    kind: "po" as const,
    id: p.id,
    supplierName: p.supplier?.name ?? null,
    itemCount: p._count.items,
    status: p.status,
    userName: p.user.name,
    createdAt: p.createdAt,
  }));
  const activities: ActivityItem[] = [...movementItems, ...poItems]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  const todayLabel = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
            Ringkasan Dashboard
          </h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            Pantau stok, nilai inventaris, dan peringatan gudang secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
          <span
            className={`inline-block h-2 w-2 animate-pulse rounded-full ${
              totalAttention > 0 ? "bg-danger-solid" : "bg-ok-solid"
            }`}
          />
          <span className="text-[12px] font-medium text-ink-soft">
            {todayLabel} ·{" "}
            <span className="text-ink-muted">
              {totalAttention > 0
                ? `${totalAttention} item butuh perhatian`
                : "Semua kondisi aman"}
            </span>
          </span>
        </div>
      </header>

      {/* KPI row — one consistent tier; detail lives in the cards below */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Perlu Perhatian"
          value={formatNumber(totalAttention)}
          icon={AlertTriangle}
          tone={
            expiredBatches.length > 0 || outOfStock.length > 0
              ? "danger"
              : lowStock.length > 0
              ? "warn"
              : "ok"
          }
          context={
            totalAttention > 0
              ? `${formatNumber(expiredBatches.length)} expired · ${formatNumber(
                  outOfStock.length
                )} habis · ${formatNumber(lowStock.length)} menipis`
              : "Semua kondisi aman"
          }
          href="/products?stock=low"
        />
        <KpiCard
          label="Stok Keluar Bulan Ini"
          value={`${formatNumber(curOutboundTotal)} unit`}
          icon={Droplets}
          delta={outboundDelta}
          context="vs bulan lalu"
        />
        <KpiCard
          label="Total Produk Aktif"
          value={formatNumber(totalActive)}
          icon={Archive}
          context={`${formatNumber(inStockCount)} tersedia · ${formatNumber(
            outOfStock.length
          )} habis`}
          href="/products?status=active"
        />
        <KpiCard
          label="Nilai Inventaris"
          value={compactRupiah(inventoryValue)}
          icon={Banknote}
          context="berdasarkan harga beli"
          href="/reports"
        />
      </div>

      {/* Main grid (8 / 4) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <AlertsCard expired={expiredBatches} nearExpiry={nearExpiryBatches} />
          <LowStockTable items={lowAndOut} />
        </div>
        <div className="space-y-6 xl:col-span-4">
          <RecentActivityCard items={activities} />
          <FastMovingCard rows={fastRows} />
        </div>
      </div>
    </div>
  );
}

function compactRupiah(n: number) {
  if (n >= 1e12) return `Rp ${(n / 1e12).toFixed(1).replace(".", ",")} T`;
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1).replace(".", ",")} M`;
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(1).replace(".", ",")} jt`;
  if (n >= 1e3) return `Rp ${(n / 1e3).toFixed(0)}rb`;
  return `Rp ${formatNumber(Math.round(n))}`;
}

function swatchFor(
  colorName: string | null,
  colorCode: string | null,
  paintType: string | null
): { color: string; light?: boolean } | null {
  const key = `${colorName ?? ""} ${colorCode ?? ""}`.toLowerCase();
  if (paintType === "thinner" || /thinner/.test(key)) return null;
  if (/white|putih|ivory|cream/.test(key)) return { color: "#ffffff", light: true };
  if (/black|hitam|jet|lamp/.test(key)) return { color: "#111827" };
  if (/red|merah|crimson|safety|oxide/.test(key)) return { color: "#ef4444" };
  if (/yellow|kuning|chrome/.test(key)) return { color: "#f59e0b" };
  if (/blue|biru|navy|phthalo/.test(key)) return { color: "#3b82f6" };
  if (/green|hijau|emerald/.test(key)) return { color: "#16a34a" };
  if (/grey|gray|abu/.test(key)) return { color: "#e5e7eb", light: true };
  if (/clear|bening|transparent/.test(key)) return { color: "#f9fafb", light: true };
  if (/brown|coklat/.test(key)) return { color: "#92400e" };
  if (/orange|jingga/.test(key)) return { color: "#f97316" };
  return { color: "#f3f4f6", light: true };
}
