import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  Palette,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/db";
import LowStockTable from "@/components/dashboard/LowStockTable";
import RecentActivityCard, {
  type ActivityItem,
} from "@/components/dashboard/RecentActivityCard";

/** Task-focused view for Staf Operasional — quick actions, no financial data. */
export default async function StaffDashboard({ name }: { name: string }) {
  const [products, recentMovements] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, sku: true, name: true, unit: true, currentStock: true, minStock: true },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        product: { select: { id: true, name: true, unit: true } },
        batch: { select: { batchNumber: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  const lowAndOut = products
    .filter((p) => p.currentStock <= p.minStock)
    .sort((a, b) => a.currentStock - b.currentStock)
    .slice(0, 8);

  const activities: ActivityItem[] = recentMovements.map((m) => ({
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
          Selamat datang, {name}
        </h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Pilih tindakan cepat untuk mencatat transaksi stok.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <ActionTile href="/stock-in" icon={ArrowDownToLine} label="Stok Masuk" tone="ok" />
        <ActionTile href="/stock-out" icon={ArrowUpFromLine} label="Stok Keluar" tone="warn" />
        <ActionTile href="/tinting" icon={Palette} label="Tinting" tone="accent" />
        <ActionTile href="/adjustments" icon={SlidersHorizontal} label="Penyesuaian" tone="accent" />
        <ActionTile href="/opname" icon={ClipboardCheck} label="Stock Opname" tone="accent" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <LowStockTable items={lowAndOut} />
        </div>
        <div className="xl:col-span-5">
          <RecentActivityCard items={activities} />
        </div>
      </div>
    </div>
  );
}

function ActionTile({
  href,
  icon: Icon,
  label,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  tone: "ok" | "warn" | "accent";
}) {
  const iconBg =
    tone === "ok"
      ? "bg-ok-bg text-ok-text"
      : tone === "warn"
      ? "bg-warn-softer text-warn-text"
      : "bg-accent-softer text-accent-text";
  return (
    <Link
      href={href}
      className="panel group flex flex-col items-center justify-center gap-3 p-6 text-center transition hover:border-accent hover:shadow-soft"
    >
      <span className={`grid h-12 w-12 place-items-center rounded-xl ${iconBg}`}>
        <Icon className="h-6 w-6" strokeWidth={2} />
      </span>
      <span className="text-[13.5px] font-semibold text-ink">{label}</span>
    </Link>
  );
}
