import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { toCsv, csvResponse, csvDateStamp } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return new Response("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const where: any = {};
  const from = sp.get("from");
  const to = sp.get("to");
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const t = new Date(to);
      t.setHours(23, 59, 59);
      where.createdAt.lte = t;
    }
  }
  if (sp.get("productId")) where.productId = Number(sp.get("productId"));
  if (sp.get("type")) where.type = sp.get("type");
  if (sp.get("reason")) where.reason = sp.get("reason");
  if (sp.get("batch")) where.batch = { batchNumber: { contains: sp.get("batch") } };
  if (sp.get("supplierId"))
    where.batch = { ...(where.batch ?? {}), supplierId: Number(sp.get("supplierId")) };
  if (sp.get("category")) where.product = { category: sp.get("category") };
  if (sp.get("rack"))
    where.product = { ...(where.product ?? {}), rackLocation: { contains: sp.get("rack") } };

  const movements = await prisma.stockMovement.findMany({
    where,
    include: { product: true, batch: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const headers = [
    "Tanggal", "Tipe", "Alasan", "SKU", "Produk", "Batch", "Qty",
    "Stok Sebelum", "Stok Sesudah", "Rak", "Pengguna", "Catatan",
  ];

  const rows = movements.map((m) => [
    m.createdAt.toISOString(),
    m.type,
    m.reason,
    m.product.sku,
    m.product.name,
    m.batch?.batchNumber ?? "",
    m.quantity,
    m.stockBefore,
    m.stockAfter,
    m.product.rackLocation ?? "",
    m.user.name,
    m.notes ?? "",
  ]);

  return csvResponse(`riwayat-stok-${csvDateStamp()}.csv`, toCsv(headers, rows));
}
