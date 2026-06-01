"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import ProductPicker from "@/components/ProductPicker";
import { formatDate } from "@/lib/utils";
import { recordOutbound } from "./actions";

type ProductOpt = {
  id: number;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  colorName: string | null;
  packageSize: string | null;
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
            (p.colorName ?? "").toLowerCase().includes(q),
        )
      : products;
    return base.slice(0, 30);
  }, [products, query]);

  useEffect(() => {
    if (!productId) {
      setBatches([]);
      setBatchId("");
      return;
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
          <div>
            <label className="label">
              Batch Disarankan (
              {batches.some((b) => b.expiryDate) ? "FEFO" : "FIFO"})
            </label>
            <select
              name="batchId"
              required
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="input"
              disabled={loadingBatches || batches.length === 0}
            >
              <option value="">
                {loadingBatches ? "Memuat…" : "— pilih batch —"}
              </option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} · qty {b.quantity}
                  {b.expiryDate ? ` · exp ${formatDate(b.expiryDate)}` : ""}
                  {b.conditionStatus !== "good"
                    ? ` · ${b.conditionStatus}`
                    : ""}
                </option>
              ))}
            </select>
            {selectedBatch ? (
              <SelectedBatch
                batch={selectedBatch}
                method={batches.some((b) => b.expiryDate) ? "FEFO" : "FIFO"}
              />
            ) : null}
          </div>

          <Field label="Jumlah *">
            <input
              name="quantity"
              type="number"
              min={1}
              max={selectedBatch?.quantity}
              required
              className="input"
            />
          </Field>

          <Field label="Alasan *">
            <select
              name="reason"
              required
              defaultValue="sale"
              className="input"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <Field label="Catatan">
        <textarea name="notes" rows={2} className="input" />
      </Field>

      {error ? (
        <div className="rounded border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn"
          disabled={pending || !productId || !batchId}
        >
          {pending ? "Menyimpan…" : "Catat Stok Keluar"}
        </button>
      </div>
    </form>
  );
}

function SelectedProduct({ product }: { product: ProductOpt }) {
  const out = product.currentStock <= 0;
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
        <span
          className={
            out
              ? "font-semibold text-danger-text"
              : "font-semibold text-ok-text"
          }
        >
          Stok: {product.currentStock} {product.unit}
        </span>
      </div>
    </div>
  );
}

function SelectedBatch({
  batch,
  method,
}: {
  batch: Batch;
  method: "FEFO" | "FIFO";
}) {
  return (
    <div className="mt-2 rounded-lg border border-line bg-canvas/60 p-3 text-[12px]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-ink">
          Batch #{batch.batchNumber}
        </span>
        <span className="badge badge-info">{method}</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-ink-muted">
        <span>Tersedia: {batch.quantity}</span>
        {batch.expiryDate ? (
          <span>Exp: {formatDate(batch.expiryDate)}</span>
        ) : null}
        {batch.conditionStatus !== "good" ? (
          <span>Kondisi: {batch.conditionStatus}</span>
        ) : null}
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
