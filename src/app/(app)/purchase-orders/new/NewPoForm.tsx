"use client";

import { useMemo, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createPurchaseOrder } from "../actions";

type ProductOpt = {
  id: number; name: string; sku: string; unit: string;
  purchasePrice: number; supplierId: number | null;
};
type SupplierOpt = { id: number; name: string };
type Line = { productId: string; quantity: string; unitCost: string };

export default function NewPoForm({
  suppliers,
  products,
  initialSupplierId,
  initialProductId,
}: {
  suppliers: SupplierOpt[];
  products: ProductOpt[];
  initialSupplierId: string;
  initialProductId?: string;
}) {
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const initialProduct = products.find((p) => String(p.id) === initialProductId);
  const [lines, setLines] = useState<Line[]>([
    initialProduct
      ? {
          productId: String(initialProduct.id),
          quantity: "",
          unitCost: String(initialProduct.purchasePrice || 0),
        }
      : { productId: "", quantity: "", unitCost: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Products filtered to the selected supplier (fallback: all)
  const selectable = useMemo(() => {
    if (!supplierId) return products;
    const scoped = products.filter((p) => String(p.supplierId) === supplierId);
    return scoped.length ? scoped : products;
  }, [products, supplierId]);

  function setLine(i: number, key: keyof Line, val: string) {
    setLines((ls) => ls.map((l, idx) => {
      if (idx !== i) return l;
      const next = { ...l, [key]: val };
      if (key === "productId") {
        const p = products.find((x) => String(x.id) === val);
        if (p && !next.unitCost) next.unitCost = String(p.purchasePrice || 0);
      }
      return next;
    }));
  }
  const addLine = () => setLines((ls) => [...ls, { productId: "", quantity: "", unitCost: "" }]);
  const removeLine = (i: number) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const total = lines.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0),
    0
  );

  function onSubmit() {
    setError(null);
    const items = lines
      .filter((l) => l.productId && Number(l.quantity) > 0)
      .map((l) => ({
        productId: Number(l.productId),
        quantityOrdered: Number(l.quantity),
        unitCost: Number(l.unitCost) || 0,
      }));
    if (items.length === 0) { setError("Tambahkan minimal satu item dengan jumlah > 0."); return; }

    startTransition(async () => {
      const res = await createPurchaseOrder({
        supplierId: supplierId ? Number(supplierId) : null,
        expectedDate: expectedDate || null,
        notes: notes || null,
        items,
      });
      if (res && "error" in res && res.error) setError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="label">Supplier</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input">
              <option value="">— pilih supplier —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Perkiraan Tiba</label>
            <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Catatan</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder="Opsional" />
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="panel-header">
          <h2 className="panel-title">Item Pesanan</h2>
          <button type="button" onClick={addLine} className="btn-secondary btn-sm">+ Tambah Item</button>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Produk</th>
                <th className="text-right">Jumlah</th>
                <th className="text-right">Harga Satuan</th>
                <th className="text-right">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const sub = (Number(l.quantity) || 0) * (Number(l.unitCost) || 0);
                return (
                  <tr key={i}>
                    <td className="min-w-[220px]">
                      <select value={l.productId} onChange={(e) => setLine(i, "productId", e.target.value)} className="input">
                        <option value="">— pilih produk —</option>
                        {selectable.map((p) => (
                          <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-right">
                      <input type="number" min={1} value={l.quantity} onChange={(e) => setLine(i, "quantity", e.target.value)} className="input w-24 text-right" />
                    </td>
                    <td className="text-right">
                      <input type="number" min={0} step="0.01" value={l.unitCost} onChange={(e) => setLine(i, "unitCost", e.target.value)} className="input w-32 text-right" />
                    </td>
                    <td className="text-right mono text-[13px]">{formatCurrency(sub)}</td>
                    <td className="text-right">
                      <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1} className="btn-ghost text-danger-text disabled:opacity-40">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right text-[12px] font-semibold uppercase tracking-widest2 text-ink-muted">Total Estimasi</td>
                <td className="text-right mono text-[15px] font-bold text-ink">{formatCurrency(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[13px] text-danger-text">{error}</div>
      ) : null}

      <div className="flex justify-end">
        <button type="button" onClick={onSubmit} disabled={pending} className="btn">
          {pending ? "Menyimpan…" : "Buat PO (Draft)"}
        </button>
      </div>
    </div>
  );
}
