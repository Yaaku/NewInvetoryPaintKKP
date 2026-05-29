/** Minimal, dependency-free CSV builder (RFC 4180-ish). */

function escapeCell(value: unknown): string {
  if (value == null) return "";
  let s = String(value);
  // Normalise newlines, then quote if needed
  if (/[",\n\r]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function toCsv(headers: string[], rows: (unknown[])[]): string {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }
  // Prepend UTF-8 BOM so Excel renders Indonesian/accented chars correctly.
  return "﻿" + lines.join("\r\n");
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function csvDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
