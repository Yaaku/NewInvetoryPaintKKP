import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/utils";

export type MonthFlow = { label: string; masuk: number; keluar: number };

/**
 * Total INBOUND vs OUTBOUND units per month for the last `months` months,
 * oldest first. Used by the owner/manager dashboards' bar chart.
 */
export async function monthlyStockFlow(months = 6): Promise<MonthFlow[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const moves = await prisma.stockMovement.findMany({
    where: { createdAt: { gte: start }, type: { in: ["INBOUND", "OUTBOUND"] } },
    select: { createdAt: true, type: true, quantity: true },
  });

  const buckets: MonthFlow[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    buckets.push({
      label: d.toLocaleDateString("id-ID", { month: "short" }),
      masuk: 0,
      keluar: 0,
    });
  }

  for (const m of moves) {
    const idx =
      (m.createdAt.getFullYear() - start.getFullYear()) * 12 +
      (m.createdAt.getMonth() - start.getMonth());
    if (idx < 0 || idx >= months) continue;
    if (m.type === "INBOUND") buckets[idx].masuk += Math.abs(m.quantity);
    else buckets[idx].keluar += Math.abs(m.quantity);
  }
  return buckets;
}

/** Compact Rupiah formatting (Rp 41,3 jt) for KPI tiles. */
export function compactRupiah(n: number): string {
  if (n >= 1e12) return `Rp ${(n / 1e12).toFixed(1).replace(".", ",")} T`;
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1).replace(".", ",")} M`;
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(1).replace(".", ",")} jt`;
  if (n >= 1e3) return `Rp ${(n / 1e3).toFixed(0)}rb`;
  return `Rp ${formatNumber(Math.round(n))}`;
}
