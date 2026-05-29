import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { _count: { select: { products: true, batches: true } } },
  });
  const user = await getCurrentUser();
  const canManage = can(user?.role, "catalog.manage");
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-sans">Supplier</h1>
          <p className="text-body-sm font-sans text-on-surface-variant">
            {suppliers.length} supplier terdaftar
          </p>
        </div>
        {canManage ? (
          <Link href="/suppliers/new" className="btn">+ Supplier Baru</Link>
        ) : null}
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th>Lead Time</th>
              <th className="text-right">Products</th><th className="text-right">Batches</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/suppliers/${s.id}`} className="font-medium hover:underline">{s.name}</Link>
                  {s.address ? <div className="text-[10px] uppercase tracking-widest text-ink-soft/60">{s.address}</div> : null}
                </td>
                <td>{s.contactName ?? "—"}</td>
                <td className="font-mono text-xs">{s.phone ?? "—"}</td>
                <td className="font-mono text-xs">{s.email ?? "—"}</td>
                <td className="font-mono">{s.leadTimeDays}d</td>
                <td className="text-right font-mono">{s._count.products}</td>
                <td className="text-right font-mono">{s._count.batches}</td>
                <td>{s.isActive ? <span className="badge badge-ok">Active</span> : <span className="badge badge-muted">Inactive</span>}</td>
              </tr>
            ))}
            {suppliers.length === 0 ? (
              <tr><td colSpan={8} className="py-10 text-center text-xs text-ink-soft/50">No suppliers yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
