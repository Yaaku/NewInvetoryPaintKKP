/** Role-based access control — pure definitions, no server dependencies. */

export const ROLES = ["staff", "manager", "admin", "owner"] as const;
export type Role = (typeof ROLES)[number];

export type Capability =
  | "stock.write"        // stock in/out, adjustments, tinting, opname
  | "stock.verify"       // validate (verify/flag) stock in/out transactions
  | "catalog.manage"     // create / edit products & suppliers
  | "catalog.delete"     // hard-delete products & suppliers
  | "procurement.manage" // create / receive purchase orders
  | "users.manage";      // manage user accounts

const ROLE_CAPS: Record<Role, Capability[]> = {
  staff: ["stock.write"],
  manager: ["stock.write", "stock.verify", "catalog.manage", "catalog.delete", "procurement.manage"],
  // Transaction verification is intentionally separated from warehouse operations.
  // Only the store manager may verify or flag stock in/out movements.
  admin: ["stock.write", "catalog.manage", "catalog.delete", "procurement.manage", "users.manage"],
  owner: ["stock.write", "catalog.manage", "catalog.delete", "procurement.manage", "users.manage"],
};

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Pemilik",
  admin: "Admin Gudang",
  manager: "Manajer Toko",
  staff: "Staf Operasional",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Akses penuh termasuk manajemen pengguna.",
  admin: "Akses penuh operasional + manajemen pengguna.",
  manager: "Kelola produk, supplier, dan semua transaksi stok.",
  staff: "Hanya transaksi stok (masuk, keluar, tinting, opname).",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function normalizeRole(value: unknown): Role {
  return isRole(value) ? value : "staff";
}

export function can(role: string | null | undefined, capability: Capability): boolean {
  const r = normalizeRole(role);
  return ROLE_CAPS[r].includes(capability);
}

/** Capabilities granted to a role (useful for passing a flat set to the client). */
export function capabilitiesFor(role: string | null | undefined): Capability[] {
  return ROLE_CAPS[normalizeRole(role)];
}
