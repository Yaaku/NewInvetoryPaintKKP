"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth";
import { suggestBatch } from "@/lib/stock";
import { withFlash } from "@/lib/utils";

const componentSchema = z.object({
  componentProductId: z.coerce.number().int(),
  quantityUsed: z.coerce.number().positive(),
  unit: z.string().trim().default("ml"),
  batchId: z.coerce.number().int().optional().nullable(),
});

const schema = z.object({
  baseProductId: z.coerce.number().int(),
  baseQuantityUsed: z.coerce.number().min(0).default(0),
  baseUnit: z.string().trim().default("L"),
  baseBatchId: z.coerce.number().int().optional().nullable(),
  colorCode: z.string().trim().optional().nullable(),
  colorName: z.string().trim().optional().nullable(),
  formulaNotes: z.string().trim().optional().nullable(),
  outputQuantity: z.coerce.number().positive(),
  outputUnit: z.string().trim().default("L"),
  notes: z.string().trim().optional().nullable(),
  components: z.array(componentSchema).min(1, "At least one colorant required"),
});

export async function recordTinting(input: z.infer<typeof schema>) {
  const user = await requireCapability("stock.write");
  const data = schema.parse(input);

  try {
    await prisma.$transaction(async (tx) => {
      // 1) Reduce base paint stock (allow 0 if direct usage records only colorants)
      if (data.baseQuantityUsed > 0) {
        const base = await tx.product.findUnique({ where: { id: data.baseProductId } });
        if (!base) throw new Error("Base product not found");

        // pick batch
        let batchId = data.baseBatchId ?? null;
        if (!batchId) {
          const batches = await tx.batch.findMany({
            where: { productId: base.id, quantity: { gt: 0 } },
            orderBy: [{ expiryDate: "asc" }, { receivedDate: "asc" }],
          });
          const suggested = suggestBatch(batches);
          if (!suggested) throw new Error(`No stock available for base paint "${base.name}"`);
          batchId = suggested.id;
        }
        const batch = await tx.batch.findUnique({ where: { id: batchId } });
        if (!batch) throw new Error("Batch not found");
        const qty = Math.ceil(data.baseQuantityUsed); // base typically integer units
        if (batch.quantity < qty) {
          throw new Error(`Batch ${batch.batchNumber} only has ${batch.quantity}`);
        }
        if (base.currentStock < qty) throw new Error(`Insufficient base stock`);

        await tx.batch.update({ where: { id: batch.id }, data: { quantity: { decrement: qty } } });
        await tx.product.update({ where: { id: base.id }, data: { currentStock: { decrement: qty } } });
        await tx.stockMovement.create({
          data: {
            productId: base.id,
            batchId: batch.id,
            userId: user.id,
            type: "TINTING",
            reason: "tinting-base",
            quantity: -qty,
            stockBefore: base.currentStock,
            stockAfter: base.currentStock - qty,
            notes: `Tinting base used: ${data.colorCode ?? ""} ${data.colorName ?? ""}`.trim() || null,
          },
        });
      }

      // 2) Create tinting record
      const record = await tx.tintingRecord.create({
        data: {
          baseProductId: data.baseProductId,
          userId: user.id,
          colorCode: data.colorCode ?? null,
          colorName: data.colorName ?? null,
          formulaNotes: data.formulaNotes ?? null,
          outputQuantity: data.outputQuantity,
          outputUnit: data.outputUnit,
          notes: data.notes ?? null,
        },
      });

      // 3) Reduce each colorant component stock
      for (const c of data.components) {
        const comp = await tx.product.findUnique({ where: { id: c.componentProductId } });
        if (!comp) throw new Error(`Component product ${c.componentProductId} not found`);

        // colorants are often fractional (ml) — round up for batch quantity decrement
        const qtyInt = Math.max(1, Math.ceil(c.quantityUsed));

        let batchId = c.batchId ?? null;
        if (!batchId) {
          const batches = await tx.batch.findMany({
            where: { productId: comp.id, quantity: { gt: 0 } },
            orderBy: [{ expiryDate: "asc" }, { receivedDate: "asc" }],
          });
          const suggested = suggestBatch(batches);
          if (!suggested) throw new Error(`No stock available for colorant "${comp.name}"`);
          batchId = suggested.id;
        }
        const batch = await tx.batch.findUnique({ where: { id: batchId } });
        if (!batch) throw new Error("Component batch not found");
        if (batch.quantity < qtyInt) {
          throw new Error(`Colorant batch ${batch.batchNumber} only has ${batch.quantity}`);
        }

        await tx.batch.update({ where: { id: batch.id }, data: { quantity: { decrement: qtyInt } } });
        const compAfter = comp.currentStock - qtyInt;
        await tx.product.update({ where: { id: comp.id }, data: { currentStock: compAfter } });

        await tx.tintingComponent.create({
          data: {
            tintingRecordId: record.id,
            componentProductId: comp.id,
            batchId: batch.id,
            quantityUsed: c.quantityUsed,
            unit: c.unit,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: comp.id,
            batchId: batch.id,
            userId: user.id,
            type: "TINTING",
            reason: "tinting-colorant",
            quantity: -qtyInt,
            stockBefore: comp.currentStock,
            stockAfter: compAfter,
            notes: `Tinting #${record.id} — ${c.quantityUsed}${c.unit}`,
          },
        });
      }

      return record;
    });
  } catch (e: any) {
    return { error: e?.message ?? "Failed to record tinting" };
  }

  revalidatePath("/tinting");
  revalidatePath("/movements");
  revalidatePath("/dashboard");
  redirect(withFlash("/tinting", "Catatan tinting tersimpan & stok komponen dikurangi."));
}
