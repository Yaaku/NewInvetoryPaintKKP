import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireCapability("catalog.manage");
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-sans">Produk Baru</h1>
        <p className="text-body-sm font-sans text-on-surface-variant">
          Setiap warna / ukuran / varian adalah SKU terpisah.
        </p>
      </div>
      <ProductForm suppliers={suppliers} />
    </div>
  );
}
