"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { applyOutbound } from "@/lib/stock";
import { requireCapability } from "@/lib/auth";
import { withFlash } from "@/lib/utils";

const schema = z.object({
  productId: z.coerce.number().int(),
  batchId: z.coerce.number().int(),
  quantity: z.coerce.number().int().positive(),
  reason: z.string().trim().min(1),
  notes: z.string().trim().optional().nullable(),
});

export async function recordOutbound(form: FormData) {
  const user = await requireCapability("stock.write");
  const obj: Record<string, any> = {};
  for (const [k, v] of form.entries()) {
    if (v === "") continue;
    obj[k] = v;
  }
  const data = schema.parse(obj);

  try {
    await applyOutbound({
      productId: data.productId,
      batchId: data.batchId,
      quantity: data.quantity,
      reason: data.reason,
      notes: data.notes ?? null,
      userId: user.id,
    });
  } catch (e: any) {
    return { error: e?.message ?? "Failed to record outbound" };
  }

  revalidatePath("/stock-out");
  revalidatePath("/products");
  revalidatePath(`/products/${data.productId}`);
  revalidatePath("/movements");
  revalidatePath("/dashboard");
  redirect(withFlash(`/products/${data.productId}`, `Stok keluar ${data.quantity} unit tercatat.`));
}
