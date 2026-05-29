"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { applyAdjustment } from "@/lib/stock";
import { requireCapability } from "@/lib/auth";
import { withFlash } from "@/lib/utils";

const schema = z.object({
  productId: z.coerce.number().int(),
  batchId: z.coerce.number().int().optional().nullable(),
  newQuantity: z.coerce.number().int().min(0),
  reason: z.string().trim().min(1),
  notes: z.string().trim().min(1, "Notes are required"),
});

export async function recordAdjustment(form: FormData) {
  const user = await requireCapability("stock.write");
  const obj: Record<string, any> = {};
  for (const [k, v] of form.entries()) {
    if (v === "") continue;
    obj[k] = v;
  }
  const data = schema.parse(obj);

  try {
    await applyAdjustment({
      productId: data.productId,
      batchId: data.batchId ?? null,
      newQuantity: data.newQuantity,
      reason: data.reason,
      notes: data.notes,
      userId: user.id,
    });
  } catch (e: any) {
    return { error: e?.message ?? "Failed" };
  }

  revalidatePath("/adjustments");
  revalidatePath("/products");
  revalidatePath(`/products/${data.productId}`);
  revalidatePath("/movements");
  revalidatePath("/dashboard");
  redirect(withFlash(`/products/${data.productId}`, "Penyesuaian stok tercatat."));
}
