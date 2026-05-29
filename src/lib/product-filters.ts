import { prisma } from "@/lib/db";

export type ProductFilterParams = {
  q?: string;
  category?: string;
  brand?: string;
  supplier?: string;
  stock?: string;
  status?: string;
};

/** Build the Prisma `where` for product list/export, with stock-status
 *  comparisons (low / ok / out) evaluated in the DB via field references. */
export function buildProductWhere(sp: ProductFilterParams): any {
  const where: any = {};
  if (sp.q) {
    const q = sp.q;
    where.OR = [
      { name: { contains: q } },
      { sku: { contains: q } },
      { brand: { contains: q } },
      { colorName: { contains: q } },
      { colorCode: { contains: q } },
      { rackLocation: { contains: q } },
    ];
  }
  if (sp.category) where.category = sp.category;
  if (sp.brand) where.brand = sp.brand;
  if (sp.supplier) where.supplierId = Number(sp.supplier);
  if (sp.status === "active") where.isActive = true;
  else if (sp.status === "inactive") where.isActive = false;

  if (sp.stock === "out") where.currentStock = { lte: 0 };
  else if (sp.stock === "low")
    where.currentStock = { gt: 0, lte: prisma.product.fields.minStock };
  else if (sp.stock === "ok") where.currentStock = { gt: prisma.product.fields.minStock };

  return where;
}
