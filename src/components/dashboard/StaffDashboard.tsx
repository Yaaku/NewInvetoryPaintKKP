import { prisma } from "@/lib/db";
import StockLookup, { type LookupProduct } from "@/components/dashboard/StockLookup";

/** Staf Operasional see only the stock lookup — to answer "apakah ada cat ini?" */
export default async function StaffDashboard({ name }: { name: string }) {
  const products: LookupProduct[] = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      colorName: true,
      colorCode: true,
      brand: true,
      category: true,
      unit: true,
      currentStock: true,
      minStock: true,
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
          Selamat datang, {name}
        </h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Cek ketersediaan stok barang untuk melayani pelanggan.
        </p>
      </header>

      <StockLookup products={products} />
    </div>
  );
}
