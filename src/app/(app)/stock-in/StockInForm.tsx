"use client";

import { useMemo, useState, useTransition } from "react";
import { recordInbound } from "./actions";

type ProductOpt = {
  id: number; name: string; sku: string; unit: string;
  packageSize: string | null; colorName: string | null;
  rackLocation: string | null; supplierId: number | null; purchasePrice: number;
};

type SupplierOpt = { id: number; name: string };

export default function StockInForm({
  products,
  suppliers,
  reasons,
  initialProductId,
}: {
  products: ProductOpt[];
  suppliers: SupplierOpt[];
  reasons: string[];
  initialProductId?: string;
}) {
  const [productId, setProductId] = useState<string>(
    initialProductId && products.some((p) => String(p.id) === initialProductId)
      ? initialProductId
      : ""
  );
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.colorName ?? "").toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [products, query]);

  const product = products.find((p) => String(p.id) === productId);

  async function onSubmit(form: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await recordInbound(form);
      if (r && "error" in r && r.error) setError(r.error);
    });
  }

  return (
    <form action={onSubmit} className="card space-y-4 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Search Product</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, SKU, color…"
            className="input"
          />
          <select
            name="productId"
            required
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              const p = products.find((p) => String(p.id) === e.target.value);
              if (p) {
                // prefill supplier/rack/cost
                const supplierEl = document.querySelector<HTMLSelectElement>('select[name="supplierId"]');
                if (supplierEl && p.supplierId) supplierEl.value = String(p.supplierId);
                const rackEl = document.querySelector<HTMLInputElement>('input[name="rackLocation"]');
                if (rackEl && p.rackLocation) rackEl.value = p.rackLocation;
                const costEl = document.querySelector<HTMLInputElement>('input[name="unitCost"]');
                if (costEl && p.purchasePrice) costEl.value = String(p.purchasePrice);
              }
            }}
            size={6}
            className="input mt-2"
          >
            {filtered.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} · {p.name}{p.colorName ? ` · ${p.colorName}` : ""}{p.packageSize ? ` · ${p.packageSize}` : ""}
              </option>
            ))}
          </select>
          {product ? (
            <p className="mt-1 text-[10px] uppercase tracking-widest text-ink-soft/60">
              Selected: {product.name} ({product.unit})
            </p>
          ) : null}
        </div>

        <div className="grid gap-3">
          <Field label="Quantity *">
            <input name="quantity" type="number" min={1} required className="input" />
          </Field>
          <Field label="Batch / Lot Number *">
            <input name="batchNumber" required className="input" placeholder="BATCH-2025-001" />
          </Field>
          <Field label="Received Date *">
            <input
              name="receivedDate"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="input"
            />
          </Field>
          <Field label="Expiry Date">
            <input name="expiryDate" type="date" className="input" />
          </Field>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Supplier">
          <select name="supplierId" className="input">
            <option value="">—</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Reason *">
          <select name="reason" defaultValue="purchase" className="input">
            {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Item Condition">
          <select name="conditionStatus" defaultValue="good" className="input">
            <option value="good">good</option>
            <option value="damaged">damaged</option>
            <option value="leaking">leaking</option>
          </select>
        </Field>
        <Field label="Unit Cost">
          <input name="unitCost" type="number" min={0} step="0.01" className="input" />
        </Field>
        <Field label="Rack Location">
          <input name="rackLocation" className="input" placeholder="A-01" />
        </Field>
        <Field label="Invoice / Receipt #">
          <input name="invoiceNumber" className="input" />
        </Field>
      </div>

      <Field label="Notes">
        <textarea name="notes" rows={2} className="input" />
      </Field>

      {error ? (
        <div className="rounded border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button type="submit" className="btn" disabled={pending || !productId}>
          {pending ? "Saving…" : "Record Inbound"}
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
