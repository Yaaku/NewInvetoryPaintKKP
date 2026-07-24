"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import ProductPicker from "@/components/ProductPicker";
import { recordAdjustment } from "./actions";

type ProductOpt = {
  id: number;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  colorName: string | null;
  packageSize: string | null;
};

type Batch = { id: number; batchNumber: string; quantity: number };

export default function AdjustmentForm({
  products,
  reasons,
  initialProductId,
}: {
  products: ProductOpt[];
  reasons: string[];
  initialProductId?: string;
}) {
  const [productId, setProductId] = useState<string>(
    initialProductId && products.some((p) => String(p.id) === initialProductId)
      ? initialProductId
      : "",
  );
  const [query, setQuery] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (
      q
        ? products.filter((p) =>
            [p.name, p.sku, p.colorName ?? ""].some((s) =>
              s.toLowerCase().includes(q),
            ),
          )
        : products
    ).slice(0, 30);
  }, [products, query]);

  useEffect(() => {
    if (!productId) {
      setBatches([]);
      setBatchId("");
      return;
    }
    fetch(`/api/product-batches?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => setBatches(d.batches ?? []));
  }, [productId]);

  const product = products.find((p) => String(p.id) === productId);
  const batch = batches.find((b) => String(b.id) === batchId);
  const currentQty = batchId
    ? (batch?.quantity ?? 0)
    : (product?.currentStock ?? 0);

  async function onSubmit(form: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await recordAdjustment(form);
      if (r && "error" in r && r.error) setError(r.error);
    });
  }

  return (
    <form action={onSubmit} className="card space-y-4 p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="space-y-3">
          <ProductPicker
            products={filtered}
            value={productId}
            onChange={setProductId}
            query={query}
            onQueryChange={setQuery}
            placeholder="Cari nama, SKU, warna…"
          />
          {product ? <SelectedProduct product={product} /> : null}
        </div>
        <div className="grid gap-3">
          <Field label="Sesuaikan Batch Tertentu (opsional)">
            <select
              name="batchId"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="input"
            >
              <option value="">— seluruh produk —</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} · qty {b.quantity}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={`Jumlah Saat Ini (${batchId ? "batch ini" : "produk"})`}
          >
            <input
              type="text"
              value={currentQty}
              readOnly
              className="input bg-paper"
            />
          </Field>
          <Field label="Jumlah Baru *">
            <input
              name="newQuantity"
              type="number"
              min={0}
              required
              className="input"
            />
          </Field>
          <Field label="Alasan *">
            <select name="reason" required className="input">
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      <Field label="Catatan *">
        <textarea
          name="notes"
          rows={2}
          required
          className="input"
          placeholder="Jelaskan penyebab penyesuaian…"
        />
      </Field>
      {error ? (
        <div className="rounded border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-text">
          {error}
        </div>
      ) : null}
      <div className="flex justify-end">
        <button type="submit" className="btn" disabled={pending || !productId}>
          {pending ? "Menyimpan…" : "Catat Penyesuaian"}
        </button>
      </div>
    </form>
  );
}

function SelectedProduct({ product }: { product: ProductOpt }) {
  return (
    <div className="rounded-lg border border-accent-border bg-accent-softer p-3">
      <div className="text-[11px] font-semibold uppercase tracking-widest2 text-accent-text">
        Produk Dipilih
      </div>
      <div className="mt-1 text-[14px] font-semibold text-ink">
        {product.name}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ink-muted">
        <span className="mono">{product.sku}</span>
        {product.colorName ? <span>{product.colorName}</span> : null}
        {product.packageSize ? <span>{product.packageSize}</span> : null}
        <span className="font-semibold text-ink-soft">
          Stok: {product.currentStock} {product.unit}
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
