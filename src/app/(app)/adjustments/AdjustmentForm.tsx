"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { recordAdjustment } from "./actions";

type ProductOpt = {
  id: number; name: string; sku: string; unit: string;
  currentStock: number; colorName: string | null; packageSize: string | null;
};

type Batch = { id: number; batchNumber: string; quantity: number };

export default function AdjustmentForm({
  products,
  reasons,
}: {
  products: ProductOpt[];
  reasons: string[];
}) {
  const [productId, setProductId] = useState("");
  const [query, setQuery] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q
      ? products.filter((p) =>
          [p.name, p.sku, p.colorName ?? ""].some((s) => s.toLowerCase().includes(q))
        )
      : products
    ).slice(0, 30);
  }, [products, query]);

  useEffect(() => {
    if (!productId) { setBatches([]); setBatchId(""); return; }
    fetch(`/api/product-batches?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => setBatches(d.batches ?? []));
  }, [productId]);

  const product = products.find((p) => String(p.id) === productId);
  const batch = batches.find((b) => String(b.id) === batchId);
  const currentQty = batchId ? batch?.quantity ?? 0 : product?.currentStock ?? 0;

  async function onSubmit(form: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await recordAdjustment(form);
      if (r && "error" in r && r.error) setError(r.error);
    });
  }

  return (
    <form action={onSubmit} className="card space-y-4 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Search Product</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="input" />
          <select
            name="productId"
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            size={6}
            className="input mt-2"
          >
            {filtered.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} · {p.name}{p.colorName ? ` · ${p.colorName}` : ""} (stock: {p.currentStock})
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3">
          <Field label="Adjust Specific Batch (optional)">
            <select name="batchId" value={batchId} onChange={(e) => setBatchId(e.target.value)} className="input">
              <option value="">— whole product —</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.batchNumber} · qty {b.quantity}</option>
              ))}
            </select>
          </Field>
          <Field label={`Current Quantity (${batchId ? "this batch" : "product"})`}>
            <input type="text" value={currentQty} readOnly className="input bg-paper" />
          </Field>
          <Field label="New Quantity *">
            <input name="newQuantity" type="number" min={0} required className="input" />
          </Field>
          <Field label="Reason *">
            <select name="reason" required className="input">
              {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>
      </div>
      <Field label="Notes *">
        <textarea name="notes" rows={2} required className="input" placeholder="Describe what happened…" />
      </Field>
      {error ? <div className="rounded border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">{error}</div> : null}
      <div className="flex justify-end">
        <button type="submit" className="btn" disabled={pending || !productId}>
          {pending ? "Saving…" : "Record Adjustment"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
