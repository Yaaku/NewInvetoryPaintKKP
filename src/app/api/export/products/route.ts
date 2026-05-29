import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { toCsv, csvResponse, csvDateStamp } from "@/lib/csv";
import { buildProductWhere } from "@/lib/product-filters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return new Response("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const where = buildProductWhere({
    q: sp.get("q") ?? undefined,
    category: sp.get("category") ?? undefined,
    brand: sp.get("brand") ?? undefined,
    supplier: sp.get("supplier") ?? undefined,
    stock: sp.get("stock") ?? undefined,
    status: sp.get("status") ?? undefined,
  });

  const filtered = await prisma.product.findMany({
    where,
    include: { supplier: true },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  const headers = [
    "SKU", "Nama Produk", "Kategori", "Brand", "Tipe Cat", "Warna", "Kode Warna",
    "Finish", "Tint Base", "Ukuran", "Unit", "Rak", "Stok Saat Ini", "Stok Minimum",
    "Status Stok", "Harga Beli", "Harga Jual", "Nilai Stok", "Supplier", "Aktif",
  ];

  const rows = filtered.map((p) => {
    const stockStatus =
      p.currentStock <= 0 ? "Habis" :
      p.currentStock <= p.minStock ? "Menipis" : "Tersedia";
    return [
      p.sku, p.name, p.category, p.brand, p.paintType, p.colorName, p.colorCode,
      p.finishType, p.tintBase, p.packageSize, p.unit, p.rackLocation,
      p.currentStock, p.minStock, stockStatus, p.purchasePrice, p.sellingPrice,
      p.currentStock * (p.purchasePrice || 0), p.supplier?.name ?? "",
      p.isActive ? "Ya" : "Tidak",
    ];
  });

  return csvResponse(`produk-${csvDateStamp()}.csv`, toCsv(headers, rows));
}
