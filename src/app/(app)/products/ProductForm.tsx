"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Wand2 } from "lucide-react";
import type { Product, Supplier } from "@prisma/client";
import { createProduct, updateProduct } from "./actions";
import { buildSku } from "@/lib/sku";

const PAINT_TYPES = [
  "wall paint", "wood paint", "metal paint", "primer", "waterproofing",
  "thinner", "putty", "brush", "roller", "sandpaper", "other",
];
const FINISH = ["matte", "satin", "semi-gloss", "gloss", "other", ""];
const TINT_BASE = ["base A", "base B", "base C", "base D", "white base", "deep base", "clear base", "n/a", ""];
const UNITS = ["pcs", "L", "kg", "can", "pail", "gallon", "roll", "sheet"];

export default function ProductForm({
  product,
  suppliers,
}: {
  product?: Product | null;
  suppliers: Supplier[];
}) {
  const [pending, startTransition] = useTransition();

  // Live SKU generation from the fields that drive the semantic code.
  const [parts, setParts] = useState({
    name: product?.name ?? "",
    brand: product?.brand ?? "",
    paintType: product?.paintType ?? "",
    tintBase: product?.tintBase ?? "",
    packageSize: product?.packageSize ?? "",
  });
  const [sku, setSku] = useState(product?.sku ?? "");
  // Existing products keep their SKU; new ones auto-fill until the user edits it.
  const [skuLocked, setSkuLocked] = useState(!!product);
  const autoSku = useMemo(() => buildSku(parts), [parts]);

  useEffect(() => {
    if (!skuLocked) setSku(autoSku);
  }, [autoSku, skuLocked]);

  const setPart = (key: keyof typeof parts) => (value: string) =>
    setParts((p) => ({ ...p, [key]: value }));

  async function onSubmit(form: FormData) {
    startTransition(async () => {
      if (product) await updateProduct(product.id, form);
      else await createProduct(form);
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <Section title="Identity">
        <Grid>
          <Field label="Product Name *">
            <input
              name="name"
              required
              defaultValue={product?.name ?? ""}
              onChange={(e) => setPart("name")(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="SKU">
            <div className="flex gap-2">
              <input
                name="sku"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value);
                  setSkuLocked(true);
                }}
                placeholder="Otomatis dari merek & tipe"
                className="input mono flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  setSkuLocked(false);
                  setSku(autoSku);
                }}
                title="Buat ulang otomatis"
                className="btn-secondary btn-sm shrink-0"
              >
                <Wand2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-ink-muted">
              {skuLocked
                ? "Diisi manual — klik ikon untuk buat otomatis."
                : "Dibuat otomatis. Ketik untuk menimpa."}
            </p>
          </Field>
          <Field label="Category">
            <input name="category" defaultValue={product?.category ?? ""} className="input" />
          </Field>
          <Field label="Brand">
            <input
              name="brand"
              defaultValue={product?.brand ?? ""}
              onChange={(e) => setPart("brand")(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Paint Type">
            <select
              name="paintType"
              defaultValue={product?.paintType ?? ""}
              onChange={(e) => setPart("paintType")(e.target.value)}
              className="input"
            >
              <option value="">—</option>
              {PAINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Main Supplier">
            <select name="supplierId" defaultValue={product?.supplierId ?? ""} className="input">
              <option value="">—</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </Grid>
      </Section>

      <Section title="Color & Variant">
        <Grid>
          <Field label="Color Name">
            <input name="colorName" defaultValue={product?.colorName ?? ""} className="input" />
          </Field>
          <Field label="Color Code">
            <input name="colorCode" defaultValue={product?.colorCode ?? ""} className="input" />
          </Field>
          <Field label="Finish / Sheen">
            <select name="finishType" defaultValue={product?.finishType ?? ""} className="input">
              {FINISH.map((f) => <option key={f} value={f}>{f || "—"}</option>)}
            </select>
          </Field>
          <Field label="Tinting Base">
            <select
              name="tintBase"
              defaultValue={product?.tintBase ?? ""}
              onChange={(e) => setPart("tintBase")(e.target.value)}
              className="input"
            >
              {TINT_BASE.map((t) => <option key={t} value={t}>{t || "—"}</option>)}
            </select>
          </Field>
          <Field label="Package Size">
            <input
              name="packageSize"
              defaultValue={product?.packageSize ?? ""}
              onChange={(e) => setPart("packageSize")(e.target.value)}
              placeholder="1L, 2.5L, 5L, gallon…"
              className="input"
            />
          </Field>
          <Field label="Unit *">
            <select name="unit" required defaultValue={product?.unit ?? "pcs"} className="input">
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
        </Grid>
      </Section>

      <Section title="Stock & Location">
        <Grid>
          <Field label="Rack Location">
            <input name="rackLocation" defaultValue={product?.rackLocation ?? ""} placeholder="A-01, B-12…" className="input" />
          </Field>
          <Field label="Minimum Stock">
            <input name="minStock" type="number" min={0} defaultValue={product?.minStock ?? 0} className="input" />
          </Field>
        </Grid>
      </Section>

      <Section title="Pricing">
        <Grid>
          <Field label="Purchase Price (per unit)">
            <input name="purchasePrice" type="number" min={0} step="0.01" defaultValue={product?.purchasePrice ?? 0} className="input" />
          </Field>
          <Field label="Selling Price (per unit)">
            <input name="sellingPrice" type="number" min={0} step="0.01" defaultValue={product?.sellingPrice ?? 0} className="input" />
          </Field>
        </Grid>
      </Section>

      <Section title="Status">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={product ? product.isActive : true} />
          Active (available for transactions)
        </label>
      </Section>

      <div className="flex justify-end gap-2">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-3">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
