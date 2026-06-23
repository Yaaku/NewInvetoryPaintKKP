"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth";
import { withFlash } from "@/lib/utils";
import { buildSku, type SkuParts } from "@/lib/sku";

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sku: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  brand: z.string().trim().optional().nullable(),
  paintType: z.string().trim().optional().nullable(),
  colorName: z.string().trim().optional().nullable(),
  colorCode: z.string().trim().optional().nullable(),
  finishType: z.string().trim().optional().nullable(),
  tintBase: z.string().trim().optional().nullable(),
  packageSize: z.string().trim().optional().nullable(),
  unit: z.string().trim().min(1).default("pcs"),
  rackLocation: z.string().trim().optional().nullable(),
  minStock: z.coerce.number().int().min(0).default(0),
  supplierId: z.coerce.number().int().optional().nullable(),
  purchasePrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

function parseForm(form: FormData) {
  const obj: Record<string, any> = {};
  for (const [k, v] of form.entries()) {
    if (v === "") continue;
    obj[k] = v;
  }
  if (form.get("isActive") === null) obj.isActive = false;
  else obj.isActive = obj.isActive === "on" || obj.isActive === "true";
  return obj;
}

/**
 * Find a free SKU based on `base`, appending a numeric suffix on collision
 * (NIP-WP-5L -> NIP-WP-5L-2 -> NIP-WP-5L-3 …). `ignoreId` lets a product keep
 * its own SKU when editing.
 */
async function uniqueSku(base: string, ignoreId?: number): Promise<string> {
  const root = base || "SKU";
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const dup = await prisma.product.findFirst({
      where: { sku: candidate, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) },
      select: { id: true },
    });
    if (!dup) return candidate;
  }
}

export async function createProduct(form: FormData) {
  await requireCapability("catalog.manage");
  const data = productSchema.parse(parseForm(form));
  const sku = await uniqueSku(data.sku?.trim() || buildSku(data as SkuParts));
  const created = await prisma.product.create({ data: { ...data, sku } });
  revalidatePath("/products");
  redirect(withFlash(`/products/${created.id}`, `Produk "${created.name}" berhasil dibuat.`));
}

export async function updateProduct(id: number, form: FormData) {
  await requireCapability("catalog.manage");
  const data = productSchema.parse(parseForm(form));
  const current = await prisma.product.findUnique({ where: { id }, select: { sku: true } });
  // Use the typed SKU; if left blank, keep the existing one (or generate when none).
  const base = data.sku?.trim() || current?.sku || buildSku(data as SkuParts);
  const sku = await uniqueSku(base, id);
  await prisma.product.update({ where: { id }, data: { ...data, sku } });
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(withFlash(`/products/${id}`, "Perubahan produk tersimpan."));
}

export async function toggleProductActive(id: number) {
  await requireCapability("catalog.manage");
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) return;
  await prisma.product.update({ where: { id }, data: { isActive: !p.isActive } });
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(
    withFlash(
      `/products/${id}`,
      p.isActive ? `Produk "${p.name}" dinonaktifkan.` : `Produk "${p.name}" diaktifkan.`
    )
  );
}

export async function deleteProduct(id: number) {
  await requireCapability("catalog.delete");
  const product = await prisma.product.findUnique({ where: { id } });
  const movements = await prisma.stockMovement.count({ where: { productId: id } });
  if (movements > 0) {
    throw new Error("Produk memiliki riwayat transaksi — nonaktifkan, bukan dihapus.");
  }
  await prisma.batch.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
  redirect(withFlash("/products", `Produk "${product?.name ?? ""}" dihapus.`));
}
