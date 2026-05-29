"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function loginAction({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return { error: "Invalid email or password" };
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: "Invalid email or password" };

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.role = user.role;
  await session.save();
  return { ok: true };
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
