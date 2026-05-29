import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/utils";
import { createOpname } from "./actions";

export const dynamic = "force-dynamic";

export default async function OpnamePage() {
  const opnames = await prisma.stockOpname.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: true, _count: { select: { items: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-sans">Stock Opname</h1>
          <p className="text-body-sm font-sans text-on-surface-variant">
            Sesi penghitungan stok fisik. Selisih akan menjadi penyesuaian setelah dikonfirmasi.
          </p>
        </div>
        <form action={createOpname}>
          <input name="notes" placeholder="Catatan sesi (opsional)" className="input mr-2 inline-block w-56" />
          <button type="submit" className="btn">+ Opname Baru</button>
        </form>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr><th>ID</th><th>Date</th><th>By</th><th className="text-right">Items</th><th>Status</th><th>Notes</th></tr>
          </thead>
          <tbody>
            {opnames.map((o) => (
              <tr key={o.id}>
                <td className="font-mono text-xs">#{o.id}</td>
                <td>
                  <Link href={`/opname/${o.id}`} className="font-medium hover:underline">
                    {formatDate(o.opnameDate)}
                  </Link>
                  <div className="text-[10px] uppercase tracking-widest text-ink-soft/60">
                    {formatDateTime(o.createdAt)}
                  </div>
                </td>
                <td>{o.user.name}</td>
                <td className="text-right font-mono">{o._count.items}</td>
                <td>
                  <span className={`badge ${
                    o.status === "confirmed" ? "badge-ok" :
                    o.status === "cancelled" ? "badge-muted" : "badge-warn"
                  }`}>{o.status}</span>
                </td>
                <td className="text-xs">{o.notes ?? "—"}</td>
              </tr>
            ))}
            {opnames.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-xs text-ink-soft/50">No opname sessions yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
