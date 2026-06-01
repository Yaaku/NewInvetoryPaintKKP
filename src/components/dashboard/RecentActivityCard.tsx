import Link from "next/link";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  ClipboardList,
  PackageMinus,
  PackagePlus,
  Paintbrush,
  SlidersHorizontal,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export type ActivityItem =
  | {
      kind: "movement";
      id: number;
      type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TINTING";
      reason: string;
      quantity: number;
      productName: string;
      productId: number;
      productUnit: string;
      batchNumber: string | null;
      userName: string;
      createdAt: Date;
    }
  | {
      kind: "po";
      id: number;
      supplierName: string | null;
      itemCount: number;
      status: string;
      userName: string;
      createdAt: Date;
    };

export default function RecentActivityCard({ items }: { items: ActivityItem[] }) {
  return (
    <section className="panel flex h-full flex-col">
      <header className="panel-header">
        <div className="flex items-center gap-2">
          <Activity className="h-[16px] w-[16px] text-ink-muted" />
          <h2 className="panel-title">Aktivitas Terbaru</h2>
        </div>
        <Link href="/movements" className="panel-action inline-flex items-center gap-0.5">
          Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="flex-1 px-5 py-12 text-center text-[13px] text-ink-muted">
          Belum ada aktivitas tercatat.
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-line">
          {items.map((it) => (
            <li key={`${it.kind}:${it.id}`}>
              <ActivityRow item={it} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  if (item.kind === "po") {
    return (
      <Link
        href={`/purchase-orders/${item.id}`}
        className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-canvas"
      >
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent-softer text-accent-text">
          <ClipboardList className="h-[16px] w-[16px]" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-ink">
            PO dibuat{item.supplierName ? ` · ${item.supplierName}` : ""}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px] text-ink-muted">
            <span>{item.itemCount} item</span>
            <span className="text-ink-faint">•</span>
            <span>oleh {item.userName}</span>
            <span className="text-ink-faint">•</span>
            <span>{formatDateTime(item.createdAt)}</span>
          </div>
        </div>
        <ChevronRight className="mt-1.5 h-3.5 w-3.5 shrink-0 text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-ink-muted" />
      </Link>
    );
  }

  const meta = movementMeta(item);
  const qty = Math.abs(item.quantity);
  const signed = item.type === "OUTBOUND" || (item.type === "ADJUSTMENT" && item.quantity < 0);
  const qtyClass = signed ? "text-danger-text" : "text-ok-text";
  const sign = signed ? "−" : "+";

  return (
    <Link
      href={`/products/${item.productId}`}
      className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-canvas"
    >
      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${meta.iconBg}`}>
        <meta.Icon className="h-[16px] w-[16px]" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className={`mono text-[13px] font-bold ${qtyClass}`}>
            {sign}
            {qty}
            {item.productUnit}
          </span>
          <span className="truncate text-[13px] text-ink">
            {meta.verb} <span className="font-semibold">{item.productName}</span>
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px] text-ink-muted">
          {item.batchNumber ? (
            <>
              <span className="mono">Batch {item.batchNumber}</span>
              <span className="text-ink-faint">•</span>
            </>
          ) : null}
          <span className="capitalize">{meta.reasonLabel}</span>
          <span className="text-ink-faint">•</span>
          <span>{item.userName}</span>
          <span className="text-ink-faint">•</span>
          <span>{formatDateTime(item.createdAt)}</span>
        </div>
      </div>
      <ChevronRight className="mt-1.5 h-3.5 w-3.5 shrink-0 text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-ink-muted" />
    </Link>
  );
}

function movementMeta(item: Extract<ActivityItem, { kind: "movement" }>) {
  switch (item.type) {
    case "INBOUND":
      return {
        verb: "stok masuk",
        reasonLabel: "penerimaan",
        Icon: ArrowDownToLine,
        iconBg: "bg-ok-bg text-ok-text",
      };
    case "OUTBOUND":
      return {
        verb: "stok keluar",
        reasonLabel: item.reason || "pengeluaran",
        Icon: ArrowUpFromLine,
        iconBg: "bg-warn-softer text-warn-text",
      };
    case "ADJUSTMENT":
      return {
        verb: item.quantity < 0 ? "penyesuaian keluar" : "penyesuaian masuk",
        reasonLabel: prettyReason(item.reason),
        Icon: item.quantity < 0 ? PackageMinus : PackagePlus,
        iconBg: item.quantity < 0
          ? "bg-danger-softer text-danger-text"
          : "bg-accent-softer text-accent-text",
      };
    case "TINTING":
      return {
        verb: "tinting",
        reasonLabel: "tinting warna",
        Icon: Paintbrush,
        iconBg: "bg-accent-softer text-accent-text",
      };
  }
}

function prettyReason(r: string) {
  if (!r) return "penyesuaian";
  if (r === "opname-difference") return "selisih opname";
  if (r === "purchase") return "pembelian";
  if (r.startsWith("write-off") || r === "expired") return "afkir";
  return r.replace(/-/g, " ");
}
