"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth";
import { withFlash } from "@/lib/utils";
import { ROLES, normalizeRole } from "@/lib/rbac";

const roleEnum = z.enum(ROLES);

const createSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi"),
  email: z.string().trim().email("Email tidak valid").transform((s) => s.toLowerCase()),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
  role: roleEnum,
});

/** How many other users could still manage users if this one were removed/demoted. */
async function otherManagerCount(excludeUserId: number): Promise<number> {
  const managers = await prisma.user.findMany({
    where: { role: { in: ["admin", "owner"] }, NOT: { id: excludeUserId } },
    select: { id: true },
  });
  return managers.length;
}

export async function createUser(form: FormData) {
  await requireCapability("users.manage");
  const parsed = createSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
    role: form.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: `Email "${email}" sudah terdaftar.` };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash, role } });

  revalidatePath("/users");
  redirect(withFlash("/users", `Pengguna "${name}" berhasil dibuat.`));
}

export async function updateUserRole(userId: number, formData: FormData) {
  await requireCapability("users.manage");
  const role = normalizeRole(formData.get("role"));
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) redirect(withFlash("/users", "Pengguna tidak ditemukan.", "error"));

  // Prevent removing the last user who can manage users.
  const isDemotion = ["admin", "owner"].includes(target.role) && !["admin", "owner"].includes(role);
  if (isDemotion && (await otherManagerCount(userId)) === 0) {
    redirect(
      withFlash("/users", "Tidak bisa menurunkan peran admin terakhir.", "error")
    );
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/users");
  redirect(withFlash("/users", `Peran "${target.name}" diperbarui.`));
}

export async function resetUserPassword(userId: number, formData: FormData) {
  await requireCapability("users.manage");
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    redirect(withFlash("/users", "Kata sandi minimal 6 karakter.", "error"));
  }
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) redirect(withFlash("/users", "Pengguna tidak ditemukan.", "error"));

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  revalidatePath("/users");
  redirect(withFlash("/users", `Kata sandi "${target.name}" direset.`));
}

export async function deleteUser(userId: number) {
  const actor = await requireCapability("users.manage");
  if (actor.id === userId) {
    redirect(withFlash("/users", "Anda tidak bisa menghapus akun sendiri.", "error"));
  }
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return;

  // Don't allow deleting the last manager/owner.
  if (["admin", "owner"].includes(target.role) && (await otherManagerCount(userId)) === 0) {
    redirect(withFlash("/users", "Tidak bisa menghapus admin terakhir.", "error"));
  }

  // Re-point historical records to the actor so audit logs stay intact.
  await prisma.stockMovement.updateMany({ where: { userId }, data: { userId: actor.id } });
  await prisma.tintingRecord.updateMany({ where: { userId }, data: { userId: actor.id } });
  await prisma.stockOpname.updateMany({ where: { userId }, data: { userId: actor.id } });
  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/users");
  redirect(withFlash("/users", `Pengguna "${target.name}" dihapus.`));
}
