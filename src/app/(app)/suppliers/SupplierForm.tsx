"use client";

import { useTransition } from "react";
import type { Supplier } from "@prisma/client";
import { createSupplier, updateSupplier } from "./actions";

export default function SupplierForm({
  supplier,
  readOnly = false,
}: {
  supplier?: Supplier | null;
  readOnly?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  async function onSubmit(form: FormData) {
    if (readOnly) return;
    startTransition(async () => {
      if (supplier) await updateSupplier(supplier.id, form);
      else await createSupplier(form);
    });
  }

  return (
    <form action={onSubmit} className="card space-y-4 p-4">
      <fieldset disabled={readOnly} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nama *"><input name="name" required defaultValue={supplier?.name ?? ""} className="input" /></Field>
          <Field label="Narahubung"><input name="contactName" defaultValue={supplier?.contactName ?? ""} className="input" /></Field>
          <Field label="Telepon / WhatsApp"><input name="phone" defaultValue={supplier?.phone ?? ""} className="input" /></Field>
          <Field label="Email"><input name="email" type="email" defaultValue={supplier?.email ?? ""} className="input" /></Field>
          <Field label="Alamat" full><textarea name="address" defaultValue={supplier?.address ?? ""} className="input" rows={2} /></Field>
          <Field label="Lead Time Pengiriman (hari)"><input name="leadTimeDays" type="number" min={0} defaultValue={supplier?.leadTimeDays ?? 0} className="input" /></Field>
          <Field label="Catatan" full><textarea name="notes" defaultValue={supplier?.notes ?? ""} className="input" rows={2} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={supplier ? supplier.isActive : true} /> Aktif
        </label>
      </fieldset>
      {readOnly ? (
        <p className="text-[12px] text-ink-muted">
          Anda hanya dapat melihat data supplier. Hubungi Manajer/Admin untuk perubahan.
        </p>
      ) : (
        <div className="flex justify-end">
          <button type="submit" className="btn" disabled={pending}>
            {pending ? "Menyimpan…" : supplier ? "Simpan Perubahan" : "Buat Supplier"}
          </button>
        </div>
      )}
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
