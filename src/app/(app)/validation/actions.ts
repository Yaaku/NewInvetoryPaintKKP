"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth";

const idSchema = z.coerce.number().int().positive();

/** Manager confirms a stock in/out transaction is correct. */
export async function verifyMovement(formData: FormData) {
  const user = await requireCapability("stock.verify");
  const id = idSchema.parse(formData.get("id"));

  await prisma.stockMovement.update({
    where: { id },
    data: {
      verificationStatus: "verified",
      verifiedById: user.id,
      verifiedAt: new Date(),
      verificationNote: null,
    },
  });

  revalidatePath("/validation");
  revalidatePath("/dashboard");
}

/** Manager flags a stock in/out transaction as problematic for the admin to correct. */
export async function flagMovement(formData: FormData) {
  const user = await requireCapability("stock.verify");
  const id = idSchema.parse(formData.get("id"));
  const note = z.string().trim().max(300).optional().parse(formData.get("note") || undefined);

  await prisma.stockMovement.update({
    where: { id },
    data: {
      verificationStatus: "flagged",
      verifiedById: user.id,
      verifiedAt: new Date(),
      verificationNote: note ?? null,
    },
  });

  revalidatePath("/validation");
  revalidatePath("/dashboard");
}
