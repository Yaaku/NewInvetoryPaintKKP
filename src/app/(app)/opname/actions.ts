"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth";
import { applyAdjustment } from "@/lib/stock";

export async function createOpname(form: FormData) {
  const user = await requireCapability("stock.write");
  const notes = String(form.get("notes") ?? "").trim() || null;
  const opname = await prisma.stockOpname.create({
    data: { userId: user.id, notes, status: "draft" },
  });

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  await prisma.stockOpnameItem.createMany({
    data: products.map((p) => ({
      stockOpnameId: opname.id,
      productId: p.id,
      systemQuantity: p.currentStock,
      physicalQuantity: p.currentStock,
      differenceQuantity: 0,
    })),
  });

  revalidatePath("/opname");
  redirect(`/opname/${opname.id}`);
}

export async function saveOpnameCounts(opnameId: number, form: FormData) {
  await requireCapability("stock.write");
  const items = await prisma.stockOpnameItem.findMany({ where: { stockOpnameId: opnameId } });

  for (const item of items) {
    const raw = form.get(`item_${item.id}`);
    if (raw === null) continue;
    const physical = Math.max(0, Math.floor(Number(raw) || 0));
    const diff = physical - item.systemQuantity;
    const note = String(form.get(`note_${item.id}`) ?? "").trim() || null;
    await prisma.stockOpnameItem.update({
      where: { id: item.id },
      data: { physicalQuantity: physical, differenceQuantity: diff, notes: note },
    });
  }

  const notes = String(form.get("notes") ?? "").trim();
  await prisma.stockOpname.update({
    where: { id: opnameId },
    data: { notes: notes || null },
  });

  revalidatePath(`/opname/${opnameId}`);
}

export async function confirmOpname(opnameId: number) {
  const user = await requireCapability("stock.write");
  const opname = await prisma.stockOpname.findUnique({
    where: { id: opnameId },
    include: { items: true },
  });
  if (!opname) throw new Error("Opname not found");
  if (opname.status !== "draft") throw new Error("Opname is already confirmed");

  for (const item of opname.items) {
    if (item.applied) continue;
    if (item.differenceQuantity === 0) continue;
    await applyAdjustment({
      productId: item.productId,
      batchId: item.batchId ?? null,
      newQuantity: item.physicalQuantity,
      reason: "opname-difference",
      notes: item.notes ?? `Stock opname #${opname.id}`,
      userId: user.id,
    });
    await prisma.stockOpnameItem.update({
      where: { id: item.id },
      data: { applied: true },
    });
  }

  await prisma.stockOpname.update({
    where: { id: opnameId },
    data: { status: "confirmed" },
  });

  revalidatePath("/opname");
  revalidatePath(`/opname/${opnameId}`);
  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/movements");
  redirect(`/opname/${opnameId}`);
}

export async function cancelOpname(opnameId: number) {
  await requireCapability("stock.write");
  await prisma.stockOpname.update({
    where: { id: opnameId },
    data: { status: "cancelled" },
  });
  revalidatePath("/opname");
  revalidatePath(`/opname/${opnameId}`);
}
