import Link from "next/link";
import { ChevronRight, ClipboardCheck, ShieldCheck, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/utils";
import { monthlyStockFlow } from "@/lib/dashboard-metrics";
import { getValidationItems } from "@/lib/validation";
import KpiCard from "@/components/dashboard/KpiCard";
import StockFlowChart from "@/components/dashboard/StockFlowChart";
import ValidationList from "@/components/dashboard/ValidationList";

/** Store-manager view — validate stock in/out transactions (separation of duties). */
export default async function ManagerDashboard({ name }: { name: string }) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [pending, flow, pendingCount, verifiedToday, flaggedCount] = await Promise.all([
    getValidationItems("pending", 25),
    monthlyStockFlow(6),
    prisma.stockMovement.count({
      where: { type: { in: ["INBOUND", "OUTBOUND"] }, verificationStatus: "pending" },
    }),
    prisma.stockMovement.count({
      where: { verificationStatus: "verified", verifiedAt: { gte: todayStart } },
    }),
    prisma.stockMovement.count({
      where: { type: { in: ["INBOUND", "OUTBOUND"] }, verificationStatus: "flagged" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
          Selamat datang, {name}
        </h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Validasi transaksi barang masuk &amp; keluar sebelum dianggap final.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KpiCard
          label="Menunggu Validasi"
          value={formatNumber(pendingCount)}
          icon={ClipboardCheck}
          tone={pendingCount > 0 ? "warn" : "ok"}
          context="transaksi masuk/keluar"
          href="/validation"
        />
        <KpiCard
          label="Terverifikasi Hari Ini"
          value={formatNumber(verifiedToday)}
          icon={ShieldCheck}
          tone="ok"
          context="transaksi tervalidasi"
        />
        <KpiCard
          label="Ditandai Bermasalah"
          value={formatNumber(flaggedCount)}
          icon={TriangleAlert}
          tone={flaggedCount > 0 ? "danger" : "default"}
          context="perlu koreksi admin"
          href="/validation?status=flagged"
        />
      </div>

      <section className="panel">
        <header className="panel-header">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-[16px] w-[16px] text-ink-muted" />
            <h2 className="panel-title">Perlu Validasi</h2>
            {pendingCount > 0 ? (
              <span className="badge badge-warn px-2 py-0.5 text-[10.5px] font-semibold">
                {formatNumber(pendingCount)} menunggu
              </span>
            ) : null}
          </div>
          <Link href="/validation" className="panel-action inline-flex items-center gap-0.5">
            Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </header>
        <ValidationList
          items={pending}
          emptyText="Semua transaksi masuk/keluar sudah divalidasi."
        />
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2 className="panel-title">Barang Masuk vs Keluar — 6 Bulan Terakhir</h2>
        </header>
        <div className="p-5">
          <StockFlowChart data={flow} />
        </div>
      </section>
    </div>
  );
}
