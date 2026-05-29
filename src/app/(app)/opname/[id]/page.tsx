import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import OpnameForm from "./OpnameForm";
import { cancelOpname, confirmOpname } from "../actions";

export const dynamic = "force-dynamic";

export default async function OpnameDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const oid = Number(id);
  if (!Number.isFinite(oid)) notFound();

  const opname = await prisma.stockOpname.findUnique({
    where: { id: oid },
    include: {
      user: true,
      items: {
        include: { product: true, batch: true },
        orderBy: { product: { name: "asc" } },
      },
    },
  });
  if (!opname) notFound();

  const totalDiff = opname.items.reduce((s, i) => s + Math.abs(i.differenceQuantity), 0);
  const diffCount = opname.items.filter((i) => i.differenceQuantity !== 0).length;
  const editable = opname.status === "draft";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-soft/60">
            <Link href="/opname" className="hover:underline">Stock Opname</Link> · #{opname.id}
          </div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">
            Opname · {formatDate(opname.opnameDate)}
          </h1>
          <div className="mt-1 flex gap-2">
            <span className={`badge ${
              opname.status === "confirmed" ? "badge-ok" :
              opname.status === "cancelled" ? "badge-muted" : "badge-warn"
            }`}>{opname.status}</span>
            <span className="badge">{opname.items.length} items</span>
            <span className="badge">{diffCount} discrepancies</span>
            <span className="badge">|Δ| = {totalDiff}</span>
          </div>
        </div>
        {editable ? (
          <div className="flex gap-2">
            <form action={cancelOpname.bind(null, opname.id)}>
              <button type="submit" className="btn-secondary">Cancel</button>
            </form>
            <form action={confirmOpname.bind(null, opname.id)}>
              <button type="submit" className="btn">Confirm & Apply Adjustments</button>
            </form>
          </div>
        ) : null}
      </div>

      <OpnameForm
        opnameId={opname.id}
        editable={editable}
        initialNotes={opname.notes ?? ""}
        items={opname.items.map((i) => ({
          id: i.id,
          productName: i.product.name,
          sku: i.product.sku,
          unit: i.product.unit,
          rackLocation: i.product.rackLocation,
          systemQuantity: i.systemQuantity,
          physicalQuantity: i.physicalQuantity,
          differenceQuantity: i.differenceQuantity,
          notes: i.notes ?? "",
          applied: i.applied,
        }))}
      />
    </div>
  );
}
