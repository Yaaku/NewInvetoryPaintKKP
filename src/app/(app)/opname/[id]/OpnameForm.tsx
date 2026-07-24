"use client";

import { useState, useTransition } from "react";
import { saveOpnameCounts } from "../actions";

type Item = {
  id: number;
  productName: string;
  sku: string;
  unit: string;
  rackLocation: string | null;
  systemQuantity: number;
  physicalQuantity: number;
  differenceQuantity: number;
  notes: string;
  applied: boolean;
};

export default function OpnameForm({
  opnameId,
  items,
  initialNotes,
  editable,
}: {
  opnameId: number;
  items: Item[];
  initialNotes: string;
  editable: boolean;
}) {
  const [physical, setPhysical] = useState<Record<number, number>>(
    Object.fromEntries(items.map((i) => [i.id, i.physicalQuantity]))
  );
  const [filter, setFilter] = useState("");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const filtered = items.filter((i) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return i.productName.toLowerCase().includes(q)
      || i.sku.toLowerCase().includes(q)
      || (i.rackLocation ?? "").toLowerCase().includes(q);
  });

  async function onSubmit(form: FormData) {
    setSaved(false);
    startTransition(async () => {
      await saveOpnameCounts(opnameId, form);
      setSaved(true);
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter products…"
          className="input max-w-xs"
        />
        <input
          name="notes"
          defaultValue={initialNotes}
          placeholder="Session notes…"
          className="input max-w-xs"
          disabled={!editable}
        />
        {editable ? (
          <button type="submit" className="btn" disabled={pending}>
            {pending ? "Saving…" : "Save Counts"}
          </button>
        ) : null}
        {saved ? <span className="text-xs text-accent">Saved.</span> : null}
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>SKU</th><th>Product</th><th>Rack</th>
              <th className="text-right">System</th>
              <th className="text-right">Physical</th>
              <th className="text-right">Difference</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const diff = (physical[i.id] ?? 0) - i.systemQuantity;
              return (
                <tr key={i.id}>
                  <td className="font-mono text-xs">{i.sku}</td>
                  <td>{i.productName}</td>
                  <td className="text-xs">{i.rackLocation ?? "—"}</td>
                  <td className="text-right font-mono">{i.systemQuantity}</td>
                  <td className="text-right">
                    <input
                      name={`item_${i.id}`}
                      type="number"
                      min={0}
                      value={physical[i.id] ?? 0}
                      onChange={(e) =>
                        setPhysical((m) => ({ ...m, [i.id]: Number(e.target.value || 0) }))
                      }
                      disabled={!editable}
                      className="input w-24 text-right font-mono"
                    />
                  </td>
                  <td className={`text-right font-mono ${diff < 0 ? "text-danger-text" : diff > 0 ? "text-accent" : "text-ink-soft/50"}`}>
                    {diff > 0 ? "+" : ""}{diff}
                  </td>
                  <td>
                    <input
                      name={`note_${i.id}`}
                      defaultValue={i.notes}
                      disabled={!editable}
                      placeholder="—"
                      className="input"
                    />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-xs text-ink-soft/50">No items.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </form>
  );
}
