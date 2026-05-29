import type { PrismaClient } from "@prisma/client";
import { NEAR_EXPIRY_DAYS } from "./utils";

export type DigestSummary = {
  outOfStock: number;
  lowStock: number;
  expiredBatches: number;
  nearExpiryBatches: number;
};

export type Digest = {
  generatedAt: Date;
  summary: DigestSummary;
  hasContent: boolean;
  subject: string;
  text: string;
  html: string;
};

const LIST_CAP = 50;

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(d: Date): number {
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

/**
 * Build the daily stock digest from the database. Pure data + rendering;
 * the caller supplies the Prisma client (shared instance or a script-local one).
 */
export async function buildDigest(
  prisma: PrismaClient,
  opts: { appUrl?: string } = {}
): Promise<Digest> {
  const now = new Date();
  const nearThreshold = new Date();
  nearThreshold.setDate(now.getDate() + NEAR_EXPIRY_DAYS);

  const [outOfStock, lowStock, expired, nearExpiry] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, currentStock: { lte: 0 } },
      orderBy: { name: "asc" },
      take: LIST_CAP,
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        currentStock: { gt: 0, lte: prisma.product.fields.minStock },
      },
      orderBy: { currentStock: "asc" },
      take: LIST_CAP,
    }),
    prisma.batch.findMany({
      where: { quantity: { gt: 0 }, expiryDate: { lt: now } },
      include: { product: { select: { name: true, unit: true } } },
      orderBy: { expiryDate: "asc" },
      take: LIST_CAP,
    }),
    prisma.batch.findMany({
      where: { quantity: { gt: 0 }, expiryDate: { gte: now, lte: nearThreshold } },
      include: { product: { select: { name: true, unit: true } } },
      orderBy: { expiryDate: "asc" },
      take: LIST_CAP,
    }),
  ]);

  const summary: DigestSummary = {
    outOfStock: outOfStock.length,
    lowStock: lowStock.length,
    expiredBatches: expired.length,
    nearExpiryBatches: nearExpiry.length,
  };
  const hasContent =
    summary.outOfStock + summary.lowStock + summary.expiredBatches + summary.nearExpiryBatches > 0;

  const dateLabel = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subject = hasContent
    ? `[InventoryCat] Ringkasan Stok — ${summary.outOfStock} habis, ${summary.lowStock} menipis, ${summary.expiredBatches} kedaluwarsa`
    : `[InventoryCat] Ringkasan Stok — semua aman`;

  // ---- Plain text ----
  const textLines: string[] = [
    `InventoryCat — Ringkasan Stok`,
    dateLabel,
    "",
    `Stok habis: ${summary.outOfStock}`,
    `Stok menipis: ${summary.lowStock}`,
    `Batch kedaluwarsa: ${summary.expiredBatches}`,
    `Batch mendekati kedaluwarsa (${NEAR_EXPIRY_DAYS} hari): ${summary.nearExpiryBatches}`,
    "",
  ];
  if (outOfStock.length) {
    textLines.push("== STOK HABIS ==");
    outOfStock.forEach((p) => textLines.push(`- ${p.sku} ${p.name} (min ${p.minStock}${p.unit})`));
    textLines.push("");
  }
  if (lowStock.length) {
    textLines.push("== STOK MENIPIS ==");
    lowStock.forEach((p) =>
      textLines.push(`- ${p.sku} ${p.name}: ${p.currentStock}/${p.minStock}${p.unit}`)
    );
    textLines.push("");
  }
  if (expired.length) {
    textLines.push("== BATCH KEDALUWARSA ==");
    expired.forEach((b) =>
      textLines.push(
        `- ${b.product.name} batch ${b.batchNumber}: ${b.quantity}${b.product.unit}, exp ${fmtDate(b.expiryDate)}`
      )
    );
    textLines.push("");
  }
  if (nearExpiry.length) {
    textLines.push(`== MENDEKATI KEDALUWARSA ==`);
    nearExpiry.forEach((b) =>
      textLines.push(
        `- ${b.product.name} batch ${b.batchNumber}: ${b.quantity}${b.product.unit}, exp ${fmtDate(b.expiryDate)} (${daysUntil(b.expiryDate!)} hari)`
      )
    );
    textLines.push("");
  }
  if (!hasContent) textLines.push("Semua stok dalam kondisi aman. Tidak ada tindakan diperlukan.");
  const text = textLines.join("\n");

  // ---- HTML ----
  const appUrl = opts.appUrl?.replace(/\/$/, "");
  const html = renderHtml({ dateLabel, summary, outOfStock, lowStock, expired, nearExpiry, appUrl, hasContent });

  return { generatedAt: now, summary, hasContent, subject, text, html };
}

// ---- HTML rendering (inline styles for email-client compatibility) ----

type BatchRow = { batchNumber: string; quantity: number; expiryDate: Date | null; product: { name: string; unit: string } };
type ProdRow = { sku: string; name: string; currentStock: number; minStock: number; unit: string };

function renderHtml(d: {
  dateLabel: string;
  summary: DigestSummary;
  outOfStock: ProdRow[];
  lowStock: ProdRow[];
  expired: BatchRow[];
  nearExpiry: BatchRow[];
  appUrl?: string;
  hasContent: boolean;
}): string {
  const C = {
    ink: "#111827",
    muted: "#6b7280",
    line: "#e5e7eb",
    danger: "#b91c1c",
    dangerBg: "#fef2f2",
    warn: "#92400e",
    warnBg: "#fffbeb",
    accent: "#4f46e5",
  };

  const stat = (label: string, value: number, color: string, bg: string) => `
    <td style="padding:12px 14px;border:1px solid ${C.line};border-radius:10px;background:${bg};">
      <div style="font:600 11px/1.2 Arial,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};">${label}</div>
      <div style="font:700 26px/1 Arial,sans-serif;color:${color};margin-top:6px;">${value}</div>
    </td>`;

  const prodTable = (title: string, rows: ProdRow[], showCurrent: boolean) =>
    rows.length === 0
      ? ""
      : `
    <h3 style="font:600 15px/1.3 Arial,sans-serif;color:${C.ink};margin:24px 0 8px;">${title}</h3>
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid ${C.line};border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <th align="left" style="font:600 11px/1 Arial,sans-serif;color:${C.muted};text-transform:uppercase;letter-spacing:.04em;padding:8px 12px;">SKU / Produk</th>
        <th align="right" style="font:600 11px/1 Arial,sans-serif;color:${C.muted};text-transform:uppercase;letter-spacing:.04em;padding:8px 12px;">${showCurrent ? "Stok / Min" : "Min"}</th>
      </tr>
      ${rows
        .map(
          (p) => `<tr style="border-top:1px solid ${C.line};">
        <td style="padding:8px 12px;font:400 13px/1.4 Arial,sans-serif;color:${C.ink};"><span style="font-family:'Courier New',monospace;color:${C.muted};">${p.sku}</span><br>${p.name}</td>
        <td align="right" style="padding:8px 12px;font:600 13px/1 'Courier New',monospace;color:${showCurrent ? C.warn : C.ink};">${showCurrent ? `${p.currentStock} / ${p.minStock}${p.unit}` : `${p.minStock}${p.unit}`}</td>
      </tr>`
        )
        .join("")}
    </table>`;

  const batchTable = (title: string, rows: BatchRow[], near: boolean) =>
    rows.length === 0
      ? ""
      : `
    <h3 style="font:600 15px/1.3 Arial,sans-serif;color:${C.ink};margin:24px 0 8px;">${title}</h3>
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid ${C.line};border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <th align="left" style="font:600 11px/1 Arial,sans-serif;color:${C.muted};text-transform:uppercase;letter-spacing:.04em;padding:8px 12px;">Produk / Batch</th>
        <th align="right" style="font:600 11px/1 Arial,sans-serif;color:${C.muted};text-transform:uppercase;letter-spacing:.04em;padding:8px 12px;">Qty</th>
        <th align="right" style="font:600 11px/1 Arial,sans-serif;color:${C.muted};text-transform:uppercase;letter-spacing:.04em;padding:8px 12px;">Kedaluwarsa</th>
      </tr>
      ${rows
        .map(
          (b) => `<tr style="border-top:1px solid ${C.line};">
        <td style="padding:8px 12px;font:400 13px/1.4 Arial,sans-serif;color:${C.ink};">${b.product.name}<br><span style="font-family:'Courier New',monospace;color:${C.muted};">${b.batchNumber}</span></td>
        <td align="right" style="padding:8px 12px;font:600 13px/1 'Courier New',monospace;color:${C.ink};">${b.quantity}${b.product.unit}</td>
        <td align="right" style="padding:8px 12px;font:400 13px/1.4 Arial,sans-serif;color:${near ? C.warn : C.danger};">${fmtDate(b.expiryDate)}${near && b.expiryDate ? `<br><span style="font-size:11px;">${daysUntil(b.expiryDate)} hari lagi</span>` : ""}</td>
      </tr>`
        )
        .join("")}
    </table>`;

  const cta = d.appUrl
    ? `<div style="margin-top:28px;"><a href="${d.appUrl}/reorder" style="display:inline-block;background:${C.accent};color:#fff;text-decoration:none;font:600 13px/1 Arial,sans-serif;padding:11px 18px;border-radius:8px;">Buka Saran Restock →</a></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="id"><body style="margin:0;background:#f8fafc;padding:24px;">
  <table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
    <table width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid ${C.line};border-radius:14px;overflow:hidden;">
      <tr><td style="padding:24px 28px;border-bottom:1px solid ${C.line};">
        <div style="font:700 18px/1.2 Arial,sans-serif;color:${C.ink};">InventoryCat — Ringkasan Stok</div>
        <div style="font:400 13px/1.4 Arial,sans-serif;color:${C.muted};margin-top:2px;">${d.dateLabel}</div>
      </td></tr>
      <tr><td style="padding:20px 28px;">
        <table width="100%" cellspacing="8" cellpadding="0"><tr>
          ${stat("Stok Habis", d.summary.outOfStock, C.danger, d.summary.outOfStock ? C.dangerBg : "#fff")}
          ${stat("Stok Menipis", d.summary.lowStock, C.warn, d.summary.lowStock ? C.warnBg : "#fff")}
        </tr><tr>
          ${stat("Batch Kedaluwarsa", d.summary.expiredBatches, C.danger, d.summary.expiredBatches ? C.dangerBg : "#fff")}
          ${stat("Mendekati Kedaluwarsa", d.summary.nearExpiryBatches, C.warn, d.summary.nearExpiryBatches ? C.warnBg : "#fff")}
        </tr></table>

        ${d.hasContent ? "" : `<p style="font:400 14px/1.5 Arial,sans-serif;color:${C.muted};margin-top:20px;">Semua stok dalam kondisi aman. Tidak ada tindakan yang diperlukan. 🎉</p>`}
        ${prodTable("Stok Habis", d.outOfStock, false)}
        ${prodTable("Stok Menipis", d.lowStock, true)}
        ${batchTable("Batch Kedaluwarsa", d.expired, false)}
        ${batchTable(`Mendekati Kedaluwarsa (${NEAR_EXPIRY_DAYS} hari)`, d.nearExpiry, true)}
        ${cta}
      </td></tr>
      <tr><td style="padding:16px 28px;border-top:1px solid ${C.line};font:400 11px/1.4 Arial,sans-serif;color:${C.muted};">
        Email otomatis dari InventoryCat. Daftar dibatasi ${LIST_CAP} item per kategori.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}
