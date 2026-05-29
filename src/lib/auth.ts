import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { normalizeRole, can, type Capability, type Role } from "@/lib/rbac";
import { withFlash } from "@/lib/utils";

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

/**
 * Resolve the authenticated user including role. Reads role from the session
 * when present; falls back to the DB for sessions created before roles existed.
 * Returns null when unauthenticated.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session.userId) return null;

  let role = session.role;
  if (!role) {
    const u = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    role = u?.role ?? "staff";
  }

  return {
    id: session.userId,
    email: session.email ?? "",
    name: session.name ?? "",
    role: normalizeRole(role),
  };
}

/** Throws (redirects to login) if unauthenticated; returns the user otherwise. */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Ensure the current user holds a capability. On failure, redirect with an
 * error toast rather than crashing — used as defense-in-depth behind hidden UI.
 */
export async function requireCapability(capability: Capability): Promise<CurrentUser> {
  const user = await requireCurrentUser();
  if (!can(user.role, capability)) {
    redirect(withFlash("/dashboard", "Anda tidak memiliki akses untuk tindakan ini.", "error"));
  }
  return user;
}
