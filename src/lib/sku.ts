/**
 * SKU generation — pure, no server dependencies (safe to import on the client).
 *
 * Mirrors the store's existing semantic convention: BRAND-TYPE-BASE-SIZE
 * e.g. Nippon Vinilex Pro Wall Paint 5L (white base) -> NIP-WP-WB-5L.
 * Uniqueness (a numeric suffix on collision) is handled server-side.
 */

const PAINT_TYPE_CODES: Record<string, string> = {
  "wall paint": "WP",
  "wood paint": "WD",
  "metal paint": "MT",
  primer: "PR",
  waterproofing: "WPF",
  thinner: "TH",
  putty: "PT",
  brush: "BR",
  roller: "RL",
  sandpaper: "SP",
  other: "OT",
};

const TINT_BASE_CODES: Record<string, string> = {
  "white base": "WB",
  "deep base": "DB",
  "clear base": "CB",
  "base A": "BA",
  "base B": "BB",
  "base C": "BC",
  "base D": "BD",
};

/** Keep only A–Z and 0–9, uppercased. */
function alnum(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function brandCode(brand: string, name: string): string {
  const fromBrand = alnum(brand).slice(0, 3);
  if (fromBrand) return fromBrand;
  const fromName = alnum(name.split(/\s+/)[0] ?? "").slice(0, 3);
  return fromName || "GEN";
}

function sizeCode(packageSize: string): string {
  // "2.5L" -> "2.5L", "1 kg" -> "1KG"; keep the decimal point for readability.
  return packageSize.toUpperCase().replace(/[^A-Z0-9.]/g, "");
}

export type SkuParts = {
  brand?: string | null;
  name?: string | null;
  paintType?: string | null;
  tintBase?: string | null;
  packageSize?: string | null;
};

/**
 * Build the semantic SKU base (without any uniqueness suffix).
 * Returns "" only when there is nothing at all to build from.
 */
export function buildSku(parts: SkuParts): string {
  const brand = (parts.brand ?? "").trim();
  const name = (parts.name ?? "").trim();
  const paintType = (parts.paintType ?? "").trim().toLowerCase();
  const tintBase = (parts.tintBase ?? "").trim();
  const packageSize = (parts.packageSize ?? "").trim();

  const segments = [
    brandCode(brand, name),
    PAINT_TYPE_CODES[paintType] ?? "",
    TINT_BASE_CODES[tintBase] ?? "",
    sizeCode(packageSize),
  ].filter(Boolean);

  return segments.join("-");
}
