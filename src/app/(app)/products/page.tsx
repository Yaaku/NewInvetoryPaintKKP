import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { buildProductWhere } from "@/lib/product-filters";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

type SP = Promise<{
  q?: string;
  category?: string;
  brand?: string;
  supplier?: string;
  stock?: "low" | "out" | "ok";
  status?: "active" | "inactive";
  page?: string;
}>;

const PAGE_SIZE = 25;

function exportQuery(sp: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const key of ["q", "category", "brand", "supplier", "stock", "status"] as const) {
    if (sp[key]) params.set(key, sp[key]!);
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = buildProductWhere(sp);

  const [total, filtered, categories, brands, suppliers] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { supplier: true },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.findMany({
      where: { category: { not: null } },
      distinct: ["category"],
      select: { category: true },
    }),
    prisma.product.findMany({
      where: { brand: { not: null } },
      distinct: ["brand"],
      select: { brand: true },
    }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const user = await getCurrentUser();
  const canManage = can(user?.role, "catalog.manage");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-sans">Produk</h1>
          <p className="text-body-sm font-sans text-on-surface-variant">
            {formatNumber(total)} produk{" "}
            {hasActiveFilter(sp) ? "cocok dengan filter" : "terdaftar"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/api/export/products${exportQuery(sp)}`}
            className="btn-secondary"
            prefetch={false}
          >
            <Download className="h-4 w-4" /> Export CSV
          </Link>
          {canManage ? (
            <Link href="/products/new" className="btn">+ Produk Baru</Link>
          ) : null}
        </div>
      </div>

      <form className="card grid gap-3 p-3 md:grid-cols-6">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Cari nama, SKU, warna, rak…"
          aria-label="Cari produk"
          className="input md:col-span-2"
        />
        <select name="category" defaultValue={sp.category ?? ""} className="input" aria-label="Filter kategori">
          <option value="">Semua kategori</option>
          {categories.filter((c) => c.category).map((c) => (
            <option key={c.category!} value={c.category!}>{c.category}</option>
          ))}
        </select>
        <select name="brand" defaultValue={sp.brand ?? ""} className="input" aria-label="Filter brand">
          <option value="">Semua brand</option>
          {brands.filter((b) => b.brand).map((b) => (
            <option key={b.brand!} value={b.brand!}>{b.brand}</option>
          ))}
        </select>
        <select name="supplier" defaultValue={sp.supplier ?? ""} className="input" aria-label="Filter supplier">
          <option value="">Semua supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select name="stock" defaultValue={sp.stock ?? ""} className="input" aria-label="Filter status stok">
          <option value="">Semua stok</option>
          <option value="ok">Tersedia</option>
          <option value="low">Menipis</option>
          <option value="out">Habis</option>
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="input md:col-span-1" aria-label="Filter status produk">
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
        <div className="md:col-span-6 flex justify-end gap-2">
          <Link href="/products" className="btn-secondary">Reset</Link>
          <button type="submit" className="btn">Terapkan</button>
        </div>
      </form>

      <div className="table-scroll">
        <table className="tbl tbl-sticky tbl-compact">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nama</th>
              <th>Brand</th>
              <th>Warna</th>
              <th>Ukuran</th>
              <th>Rak</th>
              <th className="text-right">Stok / Min</th>
              <th className="text-right">Harga</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const out = p.currentStock <= 0;
              const low = !out && p.currentStock <= p.minStock;
              return (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.sku}</td>
                  <td>
                    <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <div className="text-[10px] uppercase tracking-widest text-ink-soft/60">
                      {p.category ?? "—"} · {p.paintType ?? "—"}
                    </div>
                  </td>
                  <td>{p.brand ?? "—"}</td>
                  <td>
                    <div>{p.colorName ?? "—"}</div>
                    <div className="text-[10px] text-ink-soft/60">{p.colorCode ?? ""}</div>
                  </td>
                  <td>{p.packageSize ?? "—"}</td>
                  <td>{p.rackLocation ?? "—"}</td>
                  <td className="text-right font-mono">
                    {p.currentStock} / {p.minStock} {p.unit}
                  </td>
                  <td className="text-right font-mono">{formatCurrency(p.sellingPrice)}</td>
                  <td>
                    {!p.isActive ? (
                      <span className="badge badge-muted">Nonaktif</span>
                    ) : out ? (
                      <span className="badge badge-danger">Habis</span>
                    ) : low ? (
                      <span className="badge badge-warn">Menipis</span>
                    ) : (
                      <span className="badge badge-ok">Tersedia</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-xs text-ink-soft/50">
                  Tidak ada produk yang cocok dengan filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination
        basePath="/products"
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={PAGE_SIZE}
        params={sp}
      />
    </div>
  );
}

function hasActiveFilter(sp: Record<string, string | undefined>): boolean {
  return Boolean(sp.q || sp.category || sp.brand || sp.supplier || sp.stock || sp.status);
}
