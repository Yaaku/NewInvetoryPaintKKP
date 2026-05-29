import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

type SP = Promise<{
  from?: string; to?: string;
  productId?: string; category?: string;
  supplierId?: string; batch?: string;
  type?: string; reason?: string; rack?: string;
  page?: string;
}>;

const TYPES = ["INBOUND", "OUTBOUND", "ADJUSTMENT", "TINTING"];
const PAGE_SIZE = 50;

function exportQuery(sp: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const key of ["from", "to", "productId", "category", "supplierId", "batch", "type", "reason", "rack"] as const) {
    if (sp[key]) params.set(key, sp[key]!);
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export default async function MovementsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: any = {};
  if (sp.from || sp.to) {
    where.createdAt = {};
    if (sp.from) where.createdAt.gte = new Date(sp.from);
    if (sp.to) {
      const t = new Date(sp.to);
      t.setHours(23, 59, 59);
      where.createdAt.lte = t;
    }
  }
  if (sp.productId) where.productId = Number(sp.productId);
  if (sp.type) where.type = sp.type;
  if (sp.reason) where.reason = sp.reason;
  if (sp.batch) where.batch = { batchNumber: { contains: sp.batch } };
  if (sp.supplierId) where.batch = { ...(where.batch ?? {}), supplierId: Number(sp.supplierId) };
  if (sp.category) where.product = { category: sp.category };
  if (sp.rack) where.product = { ...(where.product ?? {}), rackLocation: { contains: sp.rack } };

  const [total, movements, products, suppliers, categories] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      include: { product: true, batch: true, user: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, sku: true } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { category: { not: null } }, distinct: ["category"], select: { category: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-lg font-sans">Riwayat Pergerakan Stok</h1>
          <p className="text-body-sm font-sans text-on-surface-variant">
            {total.toLocaleString("id-ID")} catatan
          </p>
        </div>
        <Link
          href={`/api/export/movements${exportQuery(sp)}`}
          className="btn-secondary"
          prefetch={false}
        >
          <Download className="h-4 w-4" /> Export CSV
        </Link>
      </div>

      <form className="card grid gap-3 p-3 md:grid-cols-7">
        <div><label className="label">From</label><input type="date" name="from" defaultValue={sp.from ?? ""} className="input" /></div>
        <div><label className="label">To</label><input type="date" name="to" defaultValue={sp.to ?? ""} className="input" /></div>
        <div>
          <label className="label">Product</label>
          <select name="productId" defaultValue={sp.productId ?? ""} className="input">
            <option value="">All</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category" defaultValue={sp.category ?? ""} className="input">
            <option value="">All</option>
            {categories.filter((c) => c.category).map((c) => <option key={c.category!} value={c.category!}>{c.category}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Supplier</label>
          <select name="supplierId" defaultValue={sp.supplierId ?? ""} className="input">
            <option value="">All</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div><label className="label">Batch</label><input name="batch" defaultValue={sp.batch ?? ""} className="input" /></div>
        <div>
          <label className="label">Type</label>
          <select name="type" defaultValue={sp.type ?? ""} className="input">
            <option value="">All</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><label className="label">Reason</label><input name="reason" defaultValue={sp.reason ?? ""} className="input" /></div>
        <div><label className="label">Rack</label><input name="rack" defaultValue={sp.rack ?? ""} className="input" /></div>
        <div className="md:col-span-7 flex justify-end gap-2">
          <Link href="/movements" className="btn-secondary">Reset</Link>
          <button type="submit" className="btn">Apply</button>
        </div>
      </form>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>When</th><th>Type</th><th>Reason</th><th>Product</th><th>Batch</th>
              <th className="text-right">Qty</th><th>Before → After</th><th>Rack</th><th>By</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td className="font-mono text-xs">{formatDateTime(m.createdAt)}</td>
                <td>
                  <span className={`badge ${
                    m.type === "INBOUND" ? "badge-ok" :
                    m.type === "OUTBOUND" ? "badge-danger" :
                    m.type === "ADJUSTMENT" ? "badge-warn" : ""
                  }`}>{m.type}</span>
                </td>
                <td className="text-xs">{m.reason}</td>
                <td>
                  <Link href={`/products/${m.product.id}`} className="font-medium hover:underline">
                    {m.product.name}
                  </Link>
                  <div className="text-[10px] text-ink-soft/60">{m.product.sku}</div>
                </td>
                <td className="font-mono text-xs">{m.batch?.batchNumber ?? "—"}</td>
                <td className={`text-right font-mono ${m.quantity < 0 ? "text-danger" : "text-accent"}`}>
                  {m.quantity > 0 ? "+" : ""}{m.quantity}
                </td>
                <td className="font-mono text-xs">{m.stockBefore} → {m.stockAfter}</td>
                <td className="text-xs">{m.product.rackLocation ?? "—"}</td>
                <td className="text-xs">{m.user.name}</td>
                <td className="text-xs">{m.notes ?? "—"}</td>
              </tr>
            ))}
            {movements.length === 0 ? (
              <tr><td colSpan={10} className="py-10 text-center text-xs text-ink-soft/50">Tidak ada pergerakan yang cocok dengan filter.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination
        basePath="/movements"
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={PAGE_SIZE}
        params={sp}
      />
    </div>
  );
}
