import Link from "next/link";
import { requireCapability } from "@/lib/auth";
import { getValidationItems } from "@/lib/validation";
import ValidationList from "@/components/dashboard/ValidationList";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "pending", label: "Menunggu" },
  { key: "verified", label: "Terverifikasi" },
  { key: "flagged", label: "Bermasalah" },
] as const;

type Status = (typeof TABS)[number]["key"];

export default async function ValidationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireCapability("stock.verify");
  const sp = await searchParams;
  const status: Status =
    sp.status === "verified" || sp.status === "flagged" ? sp.status : "pending";

  const items = await getValidationItems(status, 200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
          Validasi Transaksi
        </h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Verifikasi transaksi barang masuk &amp; keluar yang dicatat oleh admin gudang.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = t.key === status;
          return (
            <Link
              key={t.key}
              href={`/validation?status=${t.key}`}
              className={
                active
                  ? "btn btn-sm"
                  : "btn-secondary btn-sm"
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <section className="panel">
        <ValidationList
          items={items}
          showActions={status === "pending"}
          emptyText={
            status === "pending"
              ? "Tidak ada transaksi yang menunggu validasi."
              : status === "verified"
              ? "Belum ada transaksi terverifikasi."
              : "Tidak ada transaksi bermasalah."
          }
        />
      </section>
    </div>
  );
}
