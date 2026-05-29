import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NewPoForm from "./NewPoForm";

export const dynamic = "force-dynamic";

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string }>;
}) {
  await requireCapability("procurement.manage");
  const { supplier } = await searchParams;

  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unit: true, purchasePrice: true, supplierId: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-sans">PO Baru</h1>
        <p className="text-body-sm font-sans text-on-surface-variant">
          Pilih supplier dan tambahkan item yang akan dipesan.
        </p>
      </div>
      <NewPoForm
        suppliers={suppliers}
        products={products}
        initialSupplierId={supplier ?? ""}
      />
    </div>
  );
}
