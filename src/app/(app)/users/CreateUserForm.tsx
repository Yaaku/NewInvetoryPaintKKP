"use client";

import { useState, useTransition } from "react";
import { ROLES, ROLE_LABELS } from "@/lib/rbac";

export default function CreateUserForm({
  action,
}: {
  action: (form: FormData) => Promise<{ error?: string } | void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(form: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await action(form);
      if (res && "error" in res && res.error) setError(res.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div>
        <label className="label">Nama *</label>
        <input name="name" required className="input" />
      </div>
      <div>
        <label className="label">Email *</label>
        <input name="email" type="email" required className="input" />
      </div>
      <div>
        <label className="label">Kata Sandi *</label>
        <input name="password" type="password" minLength={6} required className="input" />
        <p className="mt-1 text-[11px] text-ink-muted">Minimal 6 karakter.</p>
      </div>
      <div>
        <label className="label">Peran *</label>
        <select name="role" defaultValue="staff" className="input">
          {ROLES.slice().reverse().map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>
      {error ? (
        <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger-text">
          {error}
        </div>
      ) : null}
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Menyimpan…" : "Buat Pengguna"}
      </button>
    </form>
  );
}
