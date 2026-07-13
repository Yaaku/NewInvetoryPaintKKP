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
import StockLookup, { type LookupProduct } from "@/components/dashboard/StockLookup";

/** Task-focused view for Staf Operasional — stock lookup for the counter,
 *  quick actions, and low-stock alerts. No financial data. */
export default async function StaffDashboard({ name }: { name: string }) {
  const products: LookupProduct[] = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      colorName: true,
      colorCode: true,
      brand: true,
      category: true,
      unit: true,
      currentStock: true,
      minStock: true,
    },
  });

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
          Cek ketersediaan stok untuk melayani pelanggan, lalu catat transaksi.
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
        <div className="xl:col-span-8">
          <StockLookup products={products} />
        </div>
        <div className="xl:col-span-4">
          <LowStockTable items={lowAndOut} />
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
