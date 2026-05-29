/**
 * Minimal, dependency-free email sender.
 *
 * Uses Resend's HTTP API (https://resend.com) when configured. If the required
 * env vars are missing it returns `{ skipped: true }` instead of throwing, so
 * the digest can run as a dry-run preview without any provider account.
 *
 * Required env to actually send:
 *   RESEND_API_KEY  — Resend API key
 *   DIGEST_FROM     — verified sender, e.g. "InventoryCat <stok@yourdomain.com>"
 *   DIGEST_TO       — comma-separated recipient list
 */

export type SendResult =
  | { sent: true; id?: string }
  | { sent: false; skipped: true; reason: string }
  | { sent: false; skipped: false; error: string };

export type EmailMessage = {
  subject: string;
  html: string;
  text: string;
  to?: string[]; // overrides DIGEST_TO
  from?: string; // overrides DIGEST_FROM
};

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.DIGEST_FROM && process.env.DIGEST_TO);
}

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = msg.from ?? process.env.DIGEST_FROM;
  const to = msg.to ?? (process.env.DIGEST_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  if (!apiKey || !from || to.length === 0) {
    return {
      sent: false,
      skipped: true,
      reason: "Email not configured (set RESEND_API_KEY, DIGEST_FROM, DIGEST_TO).",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject: msg.subject, html: msg.html, text: msg.text }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, skipped: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: data.id };
  } catch (e: any) {
    return { sent: false, skipped: false, error: e?.message ?? "Unknown email error" };
  }
}
