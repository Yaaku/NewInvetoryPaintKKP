"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { formatDate } from "@/lib/utils";
import { recordOutbound } from "./actions";

type ProductOpt = {
  id: number; name: string; sku: string; unit: string;
  currentStock: number; colorName: string | null; packageSize: string | null;
};

type Batch = {
  id: number;
  batchNumber: string;
  quantity: number;
  receivedDate: string;
  expiryDate: string | null;
  conditionStatus: string;
};

export default function StockOutForm({
  products,
  reasons,
}: {
  products: ProductOpt[];
  reasons: string[];
}) {
  const [productId, setProductId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState<string>("");
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.colorName ?? "").toLowerCase().includes(q)
        )
      : products;
    return base.slice(0, 30);
  }, [products, query]);

  useEffect(() => {
    if (!productId) {
      setBatches([]); setBatchId(""); return;
    }
    setLoadingBatches(true);
    fetch(`/api/product-batches?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => {
        setBatches(d.batches ?? []);
        setBatchId(d.suggestedBatchId ? String(d.suggestedBatchId) : "");
      })
      .finally(() => setLoadingBatches(false));
  }, [productId]);

  const product = products.find((p) => String(p.id) === productId);
  const selectedBatch = batches.find((b) => String(b.id) === batchId);

  async function onSubmit(form: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await recordOutbound(form);
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
            onChange={(e) => setProductId(e.target.value)}
            size={6}
            className="input mt-2"
          >
            {filtered.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} · {p.name}{p.colorName ? ` · ${p.colorName}` : ""}{p.packageSize ? ` · ${p.packageSize}` : ""} (stock: {p.currentStock})
              </option>
            ))}
          </select>
          {product ? (
            <p className="mt-1 text-[10px] uppercase tracking-widest text-ink-soft/60">
              In stock: {product.currentStock} {product.unit}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3">
          <div>
            <label className="label">
              Batch (suggested by {batches.some((b) => b.expiryDate) ? "FEFO" : "FIFO"})
            </label>
            <select
              name="batchId"
              required
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="input"
              disabled={loadingBatches || batches.length === 0}
            >
              <option value="">{loadingBatches ? "Loading…" : "— select batch —"}</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} · qty {b.quantity}{b.expiryDate ? ` · exp ${formatDate(b.expiryDate)}` : ""}
                  {b.conditionStatus !== "good" ? ` · ${b.conditionStatus}` : ""}
                </option>
              ))}
            </select>
            {selectedBatch ? (
              <p className="mt-1 text-[10px] uppercase tracking-widest text-ink-soft/60">
                Available in batch: {selectedBatch.quantity}
              </p>
            ) : null}
          </div>

          <Field label="Quantity *">
            <input
              name="quantity"
              type="number"
              min={1}
              max={selectedBatch?.quantity}
              required
              className="input"
            />
          </Field>

          <Field label="Reason *">
            <select name="reason" required defaultValue="sale" className="input">
              {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>
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
        <button type="submit" className="btn" disabled={pending || !productId || !batchId}>
          {pending ? "Saving…" : "Record Outbound"}
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
