"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";

export default function LoginForm({ next, error }: { next?: string; error?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("admin@bergerpaint.local");
  const [password, setPassword] = useState("admin123");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(error ?? null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErr(null);
    const result = await loginAction({ email, password });
    setPending(false);
    if (result?.error) {
      setErr("Email atau kata sandi salah.");
      return;
    }
    router.push(next || "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Email</label>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label">Kata Sandi</label>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {err ? (
        <div className="rounded border border-error/40 bg-error-container px-3 py-2 text-body-sm text-on-error-container">
          {err}
        </div>
      ) : null}
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Memproses…" : "Masuk"}
      </button>
      <p className="text-center text-label-caps font-sans uppercase text-on-surface-variant/70">
        Default: admin@bergerpaint.local / admin123
      </p>
    </form>
  );
}
