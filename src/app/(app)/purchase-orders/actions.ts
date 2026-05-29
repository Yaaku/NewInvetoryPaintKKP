"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth";
import { applyInbound } from "@/lib/stock";
import { withFlash } from "@/lib/utils";

const lineSchema = z.object({
  productId: z.coerce.number().int(),
  quantityOrdered: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().min(0).default(0),
});

const createSchema = z.object({
  supplierId: z.coerce.number().int().optional().nullable(),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  items: z.array(lineSchema).min(1, "Minimal satu item diperlukan"),
});

export async function createPurchaseOrder(input: z.infer<typeof createSchema>) {
  const user = await requireCapability("procurement.manage");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;

  const po = await prisma.purchaseOrder.create({
    data: {
      supplierId: data.supplierId ?? null,
      userId: user.id,
      status: "draft",
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      notes: data.notes ?? null,
      items: {
        create: data.items.map((i) => ({
          productId: i.productId,
          quantityOrdered: i.quantityOrdered,
          unitCost: i.unitCost,
        })),
      },
    },
  });

  revalidatePath("/purchase-orders");
  redirect(withFlash(`/purchase-orders/${po.id}`, `PO #${po.id} dibuat sebagai draft.`));
}

/** One-click: draft a PO from all below-minimum products of a given supplier. */
export async function createPoFromReorder(supplierId: number) {
  const user = await requireCapability("procurement.manage");

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      supplierId,
      currentStock: { lte: prisma.product.fields.minStock },
    },
  });

  if (products.length === 0) {
    redirect(withFlash("/reorder", "Tidak ada item di bawah minimum untuk supplier ini.", "info"));
  }

  const po = await prisma.purchaseOrder.create({
    data: {
      supplierId,
      userId: user.id,
      status: "draft",
      items: {
        create: products.map((p) => {
          const target = Math.max(p.minStock * 2, p.minStock + 1);
          return {
            productId: p.id,
            quantityOrdered: Math.max(target - p.currentStock, 1),
            unitCost: p.purchasePrice || 0,
          };
        }),
      },
    },
  });

  revalidatePath("/purchase-orders");
  redirect(withFlash(`/purchase-orders/${po.id}`, `PO #${po.id} dibuat dari ${products.length} item.`));
}

export async function markOrdered(poId: number) {
  await requireCapability("procurement.manage");
  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
  if (!po) redirect(withFlash("/purchase-orders", "PO tidak ditemukan.", "error"));
  if (po!.status !== "draft") {
    redirect(withFlash(`/purchase-orders/${poId}`, "Hanya draft yang bisa dipesan.", "error"));
  }
  await prisma.purchaseOrder.update({ where: { id: poId }, data: { status: "ordered" } });
  revalidatePath(`/purchase-orders/${poId}`);
  redirect(withFlash(`/purchase-orders/${poId}`, "PO ditandai sebagai dipesan."));
}

export async function cancelPurchaseOrder(poId: number) {
  await requireCapability("procurement.manage");
  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
  if (!po) redirect(withFlash("/purchase-orders", "PO tidak ditemukan.", "error"));
  if (po!.status === "received") {
    redirect(withFlash(`/purchase-orders/${poId}`, "PO yang sudah diterima tidak bisa dibatalkan.", "error"));
  }
  await prisma.purchaseOrder.update({ where: { id: poId }, data: { status: "cancelled" } });
  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${poId}`);
  redirect(withFlash(`/purchase-orders/${poId}`, "PO dibatalkan."));
}

/**
 * Receive a PO — fully or partially. The form supplies a per-line quantity in
 * `recv_<itemId>`; each positive quantity (capped at the line's outstanding)
 * creates a batch + inbound movement via the shared stock engine. The PO
 * becomes `received` once every line is fully received, otherwise `partial`.
 */
export async function receivePurchaseOrder(poId: number, formData: FormData) {
  const user = await requireCapability("procurement.manage");
  const invoiceNumber = String(formData.get("invoiceNumber") ?? "").trim() || null;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: { include: { product: true } } },
  });
  if (!po) redirect(withFlash("/purchase-orders", "PO tidak ditemukan.", "error"));
  if (po!.status === "received" || po!.status === "cancelled") {
    redirect(withFlash(`/purchase-orders/${poId}`, "PO sudah selesai atau dibatalkan.", "error"));
  }

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const seq = String(Date.now()).slice(-4); // keep batch numbers unique across deliveries
  let received = 0;

  for (const item of po!.items) {
    const outstanding = item.quantityOrdered - item.quantityReceived;
    if (outstanding <= 0) continue;

    const raw = formData.get(`recv_${item.id}`);
    // Default to full outstanding when the field is absent (e.g. "Terima Semua").
    const requested = raw === null ? outstanding : Math.floor(Number(raw) || 0);
    const qty = Math.max(0, Math.min(requested, outstanding));
    if (qty <= 0) continue;

    await applyInbound({
      productId: item.productId,
      quantity: qty,
      batchNumber: `PO${po!.id}-${item.product.sku}-${stamp}-${seq}`,
      receivedDate: new Date(),
      supplierId: po!.supplierId ?? null,
      unitCost: item.unitCost,
      invoiceNumber,
      rackLocation: item.product.rackLocation,
      reason: "purchase",
      notes: `Penerimaan PO #${po!.id}`,
      userId: user.id,
    });

    await prisma.purchaseOrderItem.update({
      where: { id: item.id },
      data: { quantityReceived: item.quantityReceived + qty },
    });
    received += qty;
  }

  if (received === 0) {
    redirect(withFlash(`/purchase-orders/${poId}`, "Tidak ada jumlah yang diterima.", "info"));
  }

  // Recompute completion from fresh item state.
  const fresh = await prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId: poId } });
  const fullyReceived = fresh.every((i) => i.quantityReceived >= i.quantityOrdered);

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      status: fullyReceived ? "received" : "partial",
      invoiceNumber: invoiceNumber ?? po!.invoiceNumber,
    },
  });

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${poId}`);
  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/reorder");
  revalidatePath("/movements");
  redirect(
    withFlash(
      `/purchase-orders/${poId}`,
      fullyReceived
        ? `Pesanan diterima penuh — ${received} unit masuk ke stok.`
        : `Diterima sebagian — ${received} unit masuk ke stok.`
    )
  );
}
