"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth";
import { withFlash } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(1),
  contactName: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  leadTimeDays: z.coerce.number().int().min(0).default(0),
  notes: z.string().trim().optional().nullable(),
  isActive: z.coerce.boolean().default(true),
});

function parse(form: FormData) {
  const obj: Record<string, any> = {};
  for (const [k, v] of form.entries()) {
    if (v === "") continue;
    obj[k] = v;
  }
  obj.isActive = form.get("isActive") === "on" || form.get("isActive") === "true";
  return obj;
}

export async function createSupplier(form: FormData) {
  await requireCapability("catalog.manage");
  const data = schema.parse(parse(form));
  const s = await prisma.supplier.create({ data });
  revalidatePath("/suppliers");
  redirect(withFlash(`/suppliers/${s.id}`, `Supplier "${s.name}" berhasil dibuat.`));
}

export async function updateSupplier(id: number, form: FormData) {
  await requireCapability("catalog.manage");
  const data = schema.parse(parse(form));
  await prisma.supplier.update({ where: { id }, data });
  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}`);
  redirect(withFlash(`/suppliers/${id}`, "Perubahan supplier tersimpan."));
}

export async function toggleSupplierActive(id: number) {
  await requireCapability("catalog.manage");
  const s = await prisma.supplier.findUnique({ where: { id } });
  if (!s) return;
  await prisma.supplier.update({ where: { id }, data: { isActive: !s.isActive } });
  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}`);
  redirect(
    withFlash(
      `/suppliers/${id}`,
      s.isActive ? `Supplier "${s.name}" dinonaktifkan.` : `Supplier "${s.name}" diaktifkan.`
    )
  );
}
