"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { applyInbound } from "@/lib/stock";
import { requireCapability } from "@/lib/auth";
import { withFlash } from "@/lib/utils";

const schema = z.object({
  productId: z.coerce.number().int(),
  quantity: z.coerce.number().int().positive(),
  batchNumber: z.string().trim().min(1),
  receivedDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  supplierId: z.coerce.number().int().optional().nullable(),
  unitCost: z.coerce.number().min(0).default(0),
  invoiceNumber: z.string().trim().optional().nullable(),
  rackLocation: z.string().trim().optional().nullable(),
  conditionStatus: z.string().trim().default("good"),
  reason: z.string().trim().default("purchase"),
  notes: z.string().trim().optional().nullable(),
});

export async function recordInbound(form: FormData) {
  const user = await requireCapability("stock.write");
  const obj: Record<string, any> = {};
  for (const [k, v] of form.entries()) {
    if (v === "") continue;
    obj[k] = v;
  }
  const data = schema.parse(obj);

  try {
    await applyInbound({
      productId: data.productId,
      quantity: data.quantity,
      batchNumber: data.batchNumber,
      receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      supplierId: data.supplierId ?? null,
      unitCost: data.unitCost,
      invoiceNumber: data.invoiceNumber ?? null,
      rackLocation: data.rackLocation ?? null,
      conditionStatus: data.conditionStatus,
      reason: data.reason,
      notes: data.notes ?? null,
      userId: user.id,
    });
  } catch (e: any) {
    return { error: e?.message ?? "Failed to record inbound" };
  }

  revalidatePath("/stock-in");
  revalidatePath("/products");
  revalidatePath(`/products/${data.productId}`);
  revalidatePath("/movements");
  revalidatePath("/dashboard");
  redirect(withFlash(`/products/${data.productId}`, `Stok masuk ${data.quantity} unit tercatat.`));
}
