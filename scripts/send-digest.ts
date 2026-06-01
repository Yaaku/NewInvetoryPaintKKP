/**
 * Stock digest runner for local or self-hosted scheduling
 * (cron, Windows Task Scheduler, etc.).
 *
 *   npm run digest          # send if email is configured, else preview
 *   npm run digest -- --dry # always preview (never send)
 *
 * Reads DATABASE_URL + email vars from .env (loaded by Prisma).
 */
import { PrismaClient } from "@prisma/client";
import { buildDigest } from "../src/lib/digest";
import { sendEmail, emailConfigured } from "../src/lib/email";

async function main() {
  const dry = process.argv.includes("--dry");
  const prisma = new PrismaClient();

  try {
    const digest = await buildDigest(prisma, { appUrl: process.env.APP_URL });

    console.log(`\n${digest.subject}`);
    console.log(
      `Habis: ${digest.summary.outOfStock} | Menipis: ${digest.summary.lowStock} | ` +
        `Kedaluwarsa: ${digest.summary.expiredBatches} | Mendekati: ${digest.summary.nearExpiryBatches}\n`
    );

    if (dry || !emailConfigured()) {
      console.log(dry ? "[dry-run] Preview only:\n" : "[email not configured] Preview only:\n");
      console.log(digest.text);
      return;
    }

    if (!digest.hasContent) {
      console.log("Nothing to report — skipping send. (Pass --force-equivalent via the API if needed.)");
      return;
    }

    const result = await sendEmail({
      subject: digest.subject,
      html: digest.html,
      text: digest.text,
    });
    console.log("Email result:", JSON.stringify(result));
    if ("error" in result && result.error) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
