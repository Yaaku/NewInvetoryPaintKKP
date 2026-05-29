import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth";
import ProductForm from "../../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCapability("catalog.manage");
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const [product, suppliers] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">Edit Product</h1>
        <p className="text-xs uppercase tracking-widest text-ink-soft/60">{product.sku}</p>
      </div>
      <ProductForm product={product} suppliers={suppliers} />
    </div>
  );
}
