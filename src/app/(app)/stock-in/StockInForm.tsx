"use client";

import { useMemo, useState, useTransition } from "react";
import ProductPicker from "@/components/ProductPicker";
import { recordInbound } from "./actions";

type ProductOpt = {
  id: number;
  name: string;
  sku: string;
  unit: string;
  packageSize: string | null;
  colorName: string | null;
  rackLocation: string | null;
  supplierId: number | null;
  purchasePrice: number;
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
      : "",
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
          (p.colorName ?? "").toLowerCase().includes(q),
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

  function selectProduct(id: string) {
    setProductId(id);
    const p = products.find((p) => String(p.id) === id);
    if (!p) return;

    const supplierEl = document.querySelector<HTMLSelectElement>(
      'select[name="supplierId"]',
    );
    if (supplierEl && p.supplierId) supplierEl.value = String(p.supplierId);
    const rackEl = document.querySelector<HTMLInputElement>(
      'input[name="rackLocation"]',
    );
    if (rackEl && p.rackLocation) rackEl.value = p.rackLocation;
    const costEl = document.querySelector<HTMLInputElement>(
      'input[name="unitCost"]',
    );
    if (costEl && p.purchasePrice) costEl.value = String(p.purchasePrice);
  }

  return (
    <form action={onSubmit} className="card space-y-4 p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="space-y-3">
          <ProductPicker
            products={filtered}
            value={productId}
            onChange={selectProduct}
            query={query}
            onQueryChange={setQuery}
            placeholder="Cari nama, SKU, warna…"
          />
          {product ? <SelectedProduct product={product} /> : null}
        </div>

        <div className="grid gap-3">
          <Field label="Jumlah *">
            <input
              name="quantity"
              type="number"
              min={1}
              required
              className="input"
            />
          </Field>
          <Field label="Nomor Batch / Lot *">
            <input
              name="batchNumber"
              required
              className="input"
              placeholder="BATCH-2025-001"
            />
          </Field>
          <Field label="Tanggal Terima *">
            <input
              name="receivedDate"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="input"
            />
          </Field>
          <Field label="Tanggal Kedaluwarsa">
            <input name="expiryDate" type="date" className="input" />
          </Field>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Supplier">
          <select name="supplierId" className="input">
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Alasan *">
          <select name="reason" defaultValue="purchase" className="input">
            {reasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kondisi Barang">
          <select name="conditionStatus" defaultValue="good" className="input">
            <option value="good">Baik</option>
            <option value="damaged">Rusak</option>
            <option value="leaking">Bocor</option>
          </select>
        </Field>
        <Field label="Harga Beli Satuan">
          <input
            name="unitCost"
            type="number"
            min={0}
            step="0.01"
            className="input"
          />
        </Field>
        <Field label="Lokasi Rak">
          <input name="rackLocation" className="input" placeholder="A-01" />
        </Field>
        <Field label="No. Invoice / Nota">
          <input name="invoiceNumber" className="input" />
        </Field>
      </div>

      <Field label="Catatan">
        <textarea name="notes" rows={2} className="input" />
      </Field>

      {error ? (
        <div className="rounded border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-text">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button type="submit" className="btn" disabled={pending || !productId}>
          {pending ? "Menyimpan…" : "Catat Stok Masuk"}
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
        <span>{product.unit}</span>
        {product.colorName ? <span>{product.colorName}</span> : null}
        {product.packageSize ? <span>{product.packageSize}</span> : null}
        {product.rackLocation ? <span>Rak {product.rackLocation}</span> : null}
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
