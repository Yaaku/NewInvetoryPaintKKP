import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { suggestBatch } from "@/lib/stock";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const productId = Number(req.nextUrl.searchParams.get("productId"));
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "invalid productId" }, { status: 400 });
  }

  const batches = await prisma.batch.findMany({
    where: { productId, quantity: { gt: 0 } },
    orderBy: [{ expiryDate: "asc" }, { receivedDate: "asc" }],
  });

  const suggested = suggestBatch(batches);

  return NextResponse.json({
    batches: batches.map((b) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      quantity: b.quantity,
      receivedDate: b.receivedDate,
      expiryDate: b.expiryDate,
      conditionStatus: b.conditionStatus,
    })),
    suggestedBatchId: suggested?.id ?? null,
  });
}
