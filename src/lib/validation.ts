import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ValidationItem } from "@/components/dashboard/ValidationList";

const movementInclude = {
  product: { select: { name: true, sku: true, unit: true } },
  batch: { select: { batchNumber: true } },
  user: { select: { name: true } },
  verifiedBy: { select: { name: true } },
} satisfies Prisma.StockMovementInclude;

type Row = Prisma.StockMovementGetPayload<{ include: typeof movementInclude }>;

function mapItem(m: Row): ValidationItem {
  return {
    id: m.id,
    type: m.type as "INBOUND" | "OUTBOUND",
    quantity: m.quantity,
    reason: m.reason,
    productName: m.product.name,
    productSku: m.product.sku,
    productUnit: m.product.unit,
    batchNumber: m.batch?.batchNumber ?? null,
    userName: m.user.name,
    createdAt: m.createdAt,
    status: m.verificationStatus,
    verifierName: m.verifiedBy?.name ?? null,
    verifiedAt: m.verifiedAt,
    note: m.verificationNote,
  };
}

/** Stock in/out movements filtered by verification status. Pending oldest-first. */
export async function getValidationItems(
  status: "pending" | "verified" | "flagged" | "all",
  take = 100
): Promise<ValidationItem[]> {
  const moves = await prisma.stockMovement.findMany({
    where: {
      type: { in: ["INBOUND", "OUTBOUND"] },
      ...(status !== "all" ? { verificationStatus: status } : {}),
    },
    include: movementInclude,
    orderBy: { createdAt: status === "pending" ? "asc" : "desc" },
    take,
  });
  return moves.map(mapItem);
}

export function pendingValidationCount(): Promise<number> {
  return prisma.stockMovement.count({
    where: { type: { in: ["INBOUND", "OUTBOUND"] }, verificationStatus: "pending" },
  });
}
