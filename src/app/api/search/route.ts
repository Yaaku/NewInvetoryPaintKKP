import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const MAX_RESULTS = 6;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

  if (q.length === 0) {
    return NextResponse.json({ products: [], suppliers: [] });
  }

  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { sku: { contains: q } },
          { colorName: { contains: q } },
          { colorCode: { contains: q } },
        ],
      },
      select: { id: true, name: true, sku: true, unit: true },
      orderBy: { name: "asc" },
      take: MAX_RESULTS,
    }),
    prisma.supplier.findMany({
      where: {
        isActive: true,
        name: { contains: q },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: MAX_RESULTS,
    }),
  ]);

  return NextResponse.json({ products, suppliers });
}
