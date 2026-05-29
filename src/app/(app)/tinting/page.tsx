import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import TintingForm from "./TintingForm";

export const dynamic = "force-dynamic";

export default async function TintingPage() {
  const [products, recent] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, sku: true, unit: true, currentStock: true,
        colorName: true, packageSize: true, paintType: true, tintBase: true,
      },
    }),
    prisma.tintingRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { baseProduct: true, components: { include: { componentProduct: true } }, user: true },
    }),
  ]);

  const bases = products.filter((p) =>
    (p.tintBase && p.tintBase !== "n/a") ||
    (p.paintType && ["wall paint", "wood paint", "metal paint", "primer"].includes(p.paintType))
  );
  const colorants = products.filter((p) =>
    p.paintType === "other" || (p.name.toLowerCase().includes("colorant") || p.name.toLowerCase().includes("tinter"))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-sans">Tinting / Campur Warna</h1>
        <p className="text-body-sm font-sans text-on-surface-variant">
          Catat base + colorant yang digunakan. Stok semua komponen akan dikurangi otomatis.
        </p>
      </div>
      <TintingForm allProducts={products} bases={bases} colorants={colorants} />

      <div className="card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
          Recent Tinting
        </h2>
        {recent.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-soft/50">No tinting recorded yet.</div>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium">{r.baseProduct.name}</span>
                    <span className="text-ink-soft/60"> → {r.colorName ?? "—"} {r.colorCode ? `(${r.colorCode})` : ""}</span>
                    <div className="text-[10px] uppercase tracking-widest text-ink-soft/60">
                      {formatDateTime(r.createdAt)} · by {r.user.name}
                    </div>
                  </div>
                  <div className="font-mono text-sm">
                    Output: {r.outputQuantity} {r.outputUnit}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.components.map((c) => (
                    <span key={c.id} className="badge">
                      {c.componentProduct.name}: {c.quantityUsed}{c.unit}
                    </span>
                  ))}
                </div>
                {r.formulaNotes ? (
                  <div className="mt-1 text-xs text-ink-soft/70">Formula: {r.formulaNotes}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
