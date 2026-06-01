import Link from "next/link";
import {
  AlertOctagon,
  ChevronRight,
  Clock,
  PackagePlus,
  ShieldAlert,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { daysUntil } from "@/lib/utils";

type Batch = {
  id: number;
  batchNumber: string;
  quantity: number;
  expiryDate: Date | null;
  product: { id: number; name: string; unit: string };
};

export default function AlertsCard({
  expired,
  nearExpiry,
}: {
  expired: Batch[];
  nearExpiry: Batch[];
}) {
  const headline = expired[0];
  const rows: Array<
    { kind: "danger" | "warn"; batch: Batch }
  > = [
    ...expired.slice(1).map((b) => ({ kind: "danger" as const, batch: b })),
    ...nearExpiry.map((b) => ({ kind: "warn" as const, batch: b })),
  ];

  return (
    <section className="panel">
      <header className="panel-header">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-[16px] w-[16px] text-ink-muted" />
          <h2 className="panel-title">Peringatan Stok</h2>
          {headline || rows.length > 0 ? (
            <span className="badge badge-danger px-2 py-0.5 text-[10.5px] font-semibold">
              {expired.length + nearExpiry.length} butuh perhatian
            </span>
          ) : null}
        </div>
        <Link
          href="/movements?reason=expired"
          className="panel-action inline-flex items-center gap-0.5"
        >
          Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <div>
        {headline ? <HeadlineAlert batch={headline} /> : null}

        {rows.length === 0 && !headline ? (
          <div className="px-5 py-12 text-center text-[13px] text-ink-muted">
            Tidak ada peringatan aktif. Semua stok dalam kondisi baik.
          </div>
        ) : null}

        <ul className="divide-y divide-line">
          {rows.map(({ kind, batch }) => (
            <AlertRow key={batch.id} kind={kind} batch={batch} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function HeadlineAlert({ batch }: { batch: Batch }) {
  return (
    <div className="relative border-b border-line bg-danger-bg/60">
      <div className="absolute inset-y-0 left-0 w-1 bg-danger-solid" />
      <div className="flex items-start gap-3 px-5 py-4 pl-6">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-danger-softer text-danger-solid">
          <AlertOctagon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13.5px] font-bold text-danger-textStrong">
                BATCH KEDALUWARSA: {batch.product.name}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-muted">
                <span className="mono">Batch #{batch.batchNumber}</span>
                <span className="text-ink-faint">•</span>
                <span>Kedaluwarsa {labelAgo(batch.expiryDate)}</span>
                <span className="text-ink-faint">•</span>
                <span className="font-medium text-ink-soft">
                  Qty {batch.quantity}
                  {batch.product.unit}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/adjustments?productId=${batch.product.id}`}
              className="btn-danger-outline btn-sm relative z-10"
            >
              <XCircle className="h-3.5 w-3.5" />
              Afkir / Write Off
            </Link>
            <Link
              href={`/purchase-orders/new?productId=${batch.product.id}`}
              className="btn-secondary btn-sm relative z-10"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Buat PO
            </Link>
            <Link
              href={`/products/${batch.product.id}`}
              className="btn-ghost relative z-10"
            >
              Lihat Produk
            </Link>
          </div>
        </div>
        <Link
          href={`/products/${batch.product.id}`}
          aria-label={`Lihat produk ${batch.product.name}`}
          className="absolute inset-0 z-0"
        />
      </div>
    </div>
  );
}

function AlertRow({ kind, batch }: { kind: "danger" | "warn"; batch: Batch }) {
  const isDanger = kind === "danger";
  const days = daysUntil(batch.expiryDate);
  return (
    <li className="relative">
      <div
        className={`absolute inset-y-0 left-0 w-1 ${
          isDanger ? "bg-danger-solid" : "bg-warn-solid"
        }`}
      />
      <div className="flex items-start gap-3 px-5 py-3.5 pl-6">
        <div
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
            isDanger
              ? "bg-danger-softer text-danger-solid"
              : "bg-warn-softer text-warn-solid"
          }`}
        >
          {isDanger ? (
            <AlertOctagon className="h-[16px] w-[16px]" />
          ) : (
            <Clock className="h-[16px] w-[16px]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`truncate text-[13.5px] font-semibold ${
                isDanger ? "text-danger-text" : "text-ink"
              }`}
            >
              {isDanger
                ? `BATCH KEDALUWARSA: ${batch.product.name}`
                : `Mendekati Kedaluwarsa: ${batch.product.name}`}
            </div>
            {!isDanger && days !== null ? (
              <span className="badge-warn rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider">
                {days} hari
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-muted">
            <span className="mono">Batch #{batch.batchNumber}</span>
            <span className="text-ink-faint">•</span>
            <span>
              {isDanger
                ? `Kedaluwarsa ${labelAgo(batch.expiryDate)}`
                : `Kedaluwarsa dalam ${days} hari`}
            </span>
            <span className="text-ink-faint">•</span>
            <span className="font-medium text-ink-soft">
              Qty {batch.quantity}
              {batch.product.unit}
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {isDanger ? (
              <>
                <Link
                  href={`/adjustments?productId=${batch.product.id}`}
                  className="btn-danger-outline btn-sm relative z-10"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Afkir
                </Link>
                <Link
                  href={`/purchase-orders/new?productId=${batch.product.id}`}
                  className="btn-secondary btn-sm relative z-10"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Buat PO
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/stock-in?productId=${batch.product.id}`}
                  className="btn-secondary btn-sm relative z-10"
                >
                  <PackagePlus className="h-3.5 w-3.5" />
                  Restock
                </Link>
                <Link
                  href={`/purchase-orders/new?productId=${batch.product.id}`}
                  className="btn-secondary btn-sm relative z-10"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Buat PO
                </Link>
              </>
            )}
            <Link
              href={`/products/${batch.product.id}`}
              className="btn-ghost relative z-10"
            >
              Lihat Produk
            </Link>
          </div>
        </div>
        <Link
          href={`/products/${batch.product.id}`}
          aria-label={`Lihat produk ${batch.product.name}`}
          className="absolute inset-0 z-0"
        />
      </div>
    </li>
  );
}

function labelAgo(d: Date | null) {
  if (!d) return "—";
  const diff = -Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  if (diff <= 0) return "hari ini";
  if (diff === 1) return "1 hari lalu";
  return `${diff} hari lalu`;
}
