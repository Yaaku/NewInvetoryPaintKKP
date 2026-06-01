import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildDigest } from "@/lib/digest";
import { sendEmail, emailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Stock digest cron endpoint.
 *
 * Auth: provide the CRON_SECRET via `Authorization: Bearer <secret>` header
 * or `?key=<secret>` query param.
 *
 * Query:
 *   ?dry=1        — build and return the digest without sending email
 *   ?force=1      — send even when there is nothing to report
 *
 * Schedule it from GitHub Actions, Vercel Cron, or any external scheduler.
 */
async function handle(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not set on the server." },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  const provided = bearer ?? req.nextUrl.searchParams.get("key");
  if (provided !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const force = req.nextUrl.searchParams.get("force") === "1";
  const appUrl = process.env.APP_URL || req.nextUrl.origin;

  const digest = await buildDigest(prisma, { appUrl });

  if (dry) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      emailConfigured: emailConfigured(),
      subject: digest.subject,
      summary: digest.summary,
      hasContent: digest.hasContent,
      text: digest.text,
    });
  }

  if (!digest.hasContent && !force) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: "Nothing to report. Use ?force=1 to send anyway.",
      summary: digest.summary,
    });
  }

  const result = await sendEmail({
    subject: digest.subject,
    html: digest.html,
    text: digest.text,
  });

  const status = "error" in result && result.error ? 502 : 200;
  return NextResponse.json({ ok: status === 200, summary: digest.summary, result }, { status });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
