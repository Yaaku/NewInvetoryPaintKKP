"use client";

import { useState, useTransition } from "react";
import { recordTinting } from "./actions";

type P = {
  id: number; name: string; sku: string; unit: string; currentStock: number;
  colorName: string | null; packageSize: string | null;
};

type Comp = { componentProductId: string; quantityUsed: string; unit: string };

export default function TintingForm({
  allProducts,
  bases,
  colorants,
}: {
  allProducts: P[];
  bases: P[];
  colorants: P[];
}) {
  const [components, setComponents] = useState<Comp[]>([
    { componentProductId: "", quantityUsed: "", unit: "ml" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addComp() {
    setComponents((c) => [...c, { componentProductId: "", quantityUsed: "", unit: "ml" }]);
  }
  function removeComp(i: number) {
    setComponents((c) => c.filter((_, idx) => idx !== i));
  }
  function updateComp(i: number, key: keyof Comp, val: string) {
    setComponents((c) => c.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));
  }

  async function onSubmit(formData: FormData) {
    setError(null);
    const baseProductId = Number(formData.get("baseProductId"));
    if (!baseProductId) { setError("Select a base paint"); return; }

    const validComps = components
      .filter((c) => c.componentProductId && Number(c.quantityUsed) > 0)
      .map((c) => ({
        componentProductId: Number(c.componentProductId),
        quantityUsed: Number(c.quantityUsed),
        unit: c.unit,
      }));
    if (validComps.length === 0) { setError("At least one colorant component required"); return; }

    const input = {
      baseProductId,
      baseQuantityUsed: Number(formData.get("baseQuantityUsed") || 0),
      baseUnit: String(formData.get("baseUnit") || "L"),
      baseBatchId: formData.get("baseBatchId") ? Number(formData.get("baseBatchId")) : null,
      colorCode: String(formData.get("colorCode") || "").trim() || null,
      colorName: String(formData.get("colorName") || "").trim() || null,
      formulaNotes: String(formData.get("formulaNotes") || "").trim() || null,
      outputQuantity: Number(formData.get("outputQuantity")),
      outputUnit: String(formData.get("outputUnit") || "L"),
      notes: String(formData.get("notes") || "").trim() || null,
      components: validComps,
    };

    startTransition(async () => {
      const r = await recordTinting(input);
      if (r && "error" in r && r.error) setError(r.error);
    });
  }

  return (
    <form action={onSubmit} className="card space-y-4 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Base Paint Product *">
          <select name="baseProductId" required className="input">
            <option value="">— select base —</option>
            {(bases.length > 0 ? bases : allProducts).map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} · {p.name}{p.packageSize ? ` · ${p.packageSize}` : ""} (stock: {p.currentStock})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Base Quantity Used">
          <div className="flex gap-2">
            <input name="baseQuantityUsed" type="number" min={0} step="0.01" defaultValue={1} className="input" />
            <input name="baseUnit" defaultValue="can" className="input w-24" />
          </div>
        </Field>
        <Field label="Target Color Name">
          <input name="colorName" className="input" placeholder="e.g. Ocean Blue" />
        </Field>
        <Field label="Target Color Code">
          <input name="colorCode" className="input" placeholder="e.g. B-2034" />
        </Field>
        <Field label="Output Quantity *">
          <input name="outputQuantity" type="number" min={0} step="0.01" required className="input" />
        </Field>
        <Field label="Output Unit">
          <input name="outputUnit" defaultValue="L" className="input" />
        </Field>
      </div>

      <Field label="Formula Notes">
        <textarea name="formulaNotes" rows={2} className="input" placeholder="e.g. Base A + 12ml red + 8ml yellow" />
      </Field>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="label !mb-0">Colorant Components *</label>
          <button type="button" onClick={addComp} className="btn-secondary">+ Add</button>
        </div>
        <div className="space-y-2">
          {components.map((c, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[1fr_120px_80px_auto]">
              <select
                value={c.componentProductId}
                onChange={(e) => updateComp(i, "componentProductId", e.target.value)}
                className="input"
              >
                <option value="">— select colorant —</option>
                {(colorants.length > 0 ? colorants : allProducts).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (stock: {p.currentStock} {p.unit})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Qty"
                value={c.quantityUsed}
                onChange={(e) => updateComp(i, "quantityUsed", e.target.value)}
                className="input"
              />
              <input
                value={c.unit}
                onChange={(e) => updateComp(i, "unit", e.target.value)}
                className="input"
              />
              <button type="button" onClick={() => removeComp(i)} className="btn-secondary" disabled={components.length === 1}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <Field label="Notes">
        <textarea name="notes" rows={2} className="input" />
      </Field>

      {error ? (
        <div className="rounded border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">{error}</div>
      ) : null}

      <div className="flex justify-end">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Saving…" : "Record Tinting"}
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
