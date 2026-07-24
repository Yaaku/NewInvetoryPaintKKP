import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NewPoForm from "./NewPoForm";

export const dynamic = "force-dynamic";

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string; productId?: string }>;
}) {
  await requireCapability("procurement.manage");
  const { supplier, productId } = await searchParams;

  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unit: true, purchasePrice: true, supplierId: true },
    }),
  ]);

  // Deep links from dashboard alerts pass ?productId= — prefill its supplier + first line.
  const initialProduct = productId
    ? products.find((p) => String(p.id) === productId)
    : undefined;
  const initialSupplierId =
    supplier ?? (initialProduct?.supplierId ? String(initialProduct.supplierId) : "");

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
        initialSupplierId={initialSupplierId}
        initialProductId={initialProduct ? String(initialProduct.id) : ""}
      />
    </div>
  );
}
