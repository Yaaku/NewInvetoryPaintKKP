import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysUntil(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export const NEAR_EXPIRY_DAYS = 60;

/** Build a path with a one-shot flash toast message for ToastHost to display. */
export function withFlash(
  path: string,
  message: string,
  type: "success" | "error" | "info" = "success"
): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}flash=${encodeURIComponent(message)}&flashType=${type}`;
}
