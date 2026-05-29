import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type MovementType = "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TINTING";

export async function applyInbound(params: {
  productId: number;
  quantity: number;
  batchNumber: string;
  receivedDate?: Date;
  expiryDate?: Date | null;
  supplierId?: number | null;
  unitCost?: number;
  invoiceNumber?: string | null;
  rackLocation?: string | null;
  conditionStatus?: string;
  reason: string;
  notes?: string | null;
  userId: number;
}) {
  if (params.quantity <= 0) throw new Error("Inbound quantity must be positive");

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: params.productId } });
    if (!product) throw new Error("Product not found");

    let batch = await tx.batch.findUnique({
      where: { productId_batchNumber: { productId: product.id, batchNumber: params.batchNumber } },
    });

    if (batch) {
      batch = await tx.batch.update({
        where: { id: batch.id },
        data: {
          quantity: { increment: params.quantity },
          initialQuantity: { increment: params.quantity },
          supplierId: params.supplierId ?? batch.supplierId,
          unitCost: params.unitCost ?? batch.unitCost,
          invoiceNumber: params.invoiceNumber ?? batch.invoiceNumber,
          conditionStatus: params.conditionStatus ?? batch.conditionStatus,
          expiryDate: params.expiryDate ?? batch.expiryDate,
        },
      });
    } else {
      batch = await tx.batch.create({
        data: {
          productId: product.id,
          supplierId: params.supplierId ?? null,
          batchNumber: params.batchNumber,
          quantity: params.quantity,
          initialQuantity: params.quantity,
          receivedDate: params.receivedDate ?? new Date(),
          expiryDate: params.expiryDate ?? null,
          unitCost: params.unitCost ?? 0,
          invoiceNumber: params.invoiceNumber ?? null,
          conditionStatus: params.conditionStatus ?? "good",
        },
      });
    }

    const before = product.currentStock;
    const after = before + params.quantity;

    await tx.product.update({
      where: { id: product.id },
      data: {
        currentStock: after,
        rackLocation: params.rackLocation ?? product.rackLocation,
        purchasePrice: params.unitCost && params.unitCost > 0 ? params.unitCost : product.purchasePrice,
      },
    });

    await tx.stockMovement.create({
      data: {
        productId: product.id,
        batchId: batch.id,
        userId: params.userId,
        type: "INBOUND",
        reason: params.reason,
        quantity: params.quantity,
        stockBefore: before,
        stockAfter: after,
        destinationLocation: params.rackLocation ?? product.rackLocation ?? null,
        notes: params.notes ?? null,
      },
    });

    return { batchId: batch.id, stockAfter: after };
  });
}

export async function applyOutbound(params: {
  productId: number;
  batchId: number;
  quantity: number;
  reason: string;
  notes?: string | null;
  userId: number;
  allowNegative?: boolean;
}) {
  if (params.quantity <= 0) throw new Error("Outbound quantity must be positive");

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: params.productId } });
    if (!product) throw new Error("Product not found");

    const batch = await tx.batch.findUnique({ where: { id: params.batchId } });
    if (!batch || batch.productId !== product.id) throw new Error("Batch not found for this product");

    if (!params.allowNegative && batch.quantity < params.quantity) {
      throw new Error(`Batch ${batch.batchNumber} only has ${batch.quantity} available.`);
    }
    if (!params.allowNegative && product.currentStock < params.quantity) {
      throw new Error(`Product only has ${product.currentStock} ${product.unit} in stock.`);
    }

    const before = product.currentStock;
    const after = before - params.quantity;

    await tx.batch.update({
      where: { id: batch.id },
      data: { quantity: { decrement: params.quantity } },
    });

    await tx.product.update({
      where: { id: product.id },
      data: { currentStock: after },
    });

    await tx.stockMovement.create({
      data: {
        productId: product.id,
        batchId: batch.id,
        userId: params.userId,
        type: "OUTBOUND",
        reason: params.reason,
        quantity: -params.quantity,
        stockBefore: before,
        stockAfter: after,
        sourceLocation: product.rackLocation ?? null,
        notes: params.notes ?? null,
      },
    });

    return { stockAfter: after };
  });
}

export async function applyAdjustment(params: {
  productId: number;
  batchId?: number | null;
  newQuantity: number; // physical/desired final qty
  reason: string;
  notes: string;
  userId: number;
  movementType?: MovementType;
}) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: params.productId } });
    if (!product) throw new Error("Product not found");

    let batch = params.batchId
      ? await tx.batch.findUnique({ where: { id: params.batchId } })
      : null;

    let before: number;
    let after: number;
    let delta: number;

    if (batch) {
      before = batch.quantity;
      after = params.newQuantity;
      delta = after - before;
      await tx.batch.update({ where: { id: batch.id }, data: { quantity: after } });
      // adjust product stock by same delta
      const productAfter = product.currentStock + delta;
      await tx.product.update({ where: { id: product.id }, data: { currentStock: productAfter } });
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          batchId: batch.id,
          userId: params.userId,
          type: params.movementType ?? "ADJUSTMENT",
          reason: params.reason,
          quantity: delta,
          stockBefore: product.currentStock,
          stockAfter: productAfter,
          notes: params.notes,
        },
      });
      return { stockAfter: productAfter };
    } else {
      before = product.currentStock;
      after = params.newQuantity;
      delta = after - before;
      await tx.product.update({ where: { id: product.id }, data: { currentStock: after } });
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          batchId: null,
          userId: params.userId,
          type: params.movementType ?? "ADJUSTMENT",
          reason: params.reason,
          quantity: delta,
          stockBefore: before,
          stockAfter: after,
          notes: params.notes,
        },
      });
      return { stockAfter: after };
    }
  });
}

/** Suggest batch for outbound: FEFO if any batch has an expiry, else FIFO. */
export function suggestBatch<T extends { quantity: number; expiryDate: Date | null; receivedDate: Date }>(
  batches: T[]
): T | null {
  const available = batches.filter((b) => b.quantity > 0);
  if (available.length === 0) return null;
  const withExpiry = available.filter((b) => b.expiryDate !== null);
  if (withExpiry.length > 0) {
    return [...withExpiry].sort(
      (a, b) => (a.expiryDate!.getTime() - b.expiryDate!.getTime())
    )[0];
  }
  return [...available].sort((a, b) => a.receivedDate.getTime() - b.receivedDate.getTime())[0];
}
