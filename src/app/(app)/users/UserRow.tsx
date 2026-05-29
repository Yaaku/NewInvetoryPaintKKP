"use client";

import { useState } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/rbac";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { updateUserRole, resetUserPassword, deleteUser } from "./actions";

type U = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

const ROLE_BADGE: Record<string, string> = {
  owner: "badge-info",
  admin: "badge-info",
  manager: "badge-warn",
  staff: "badge-muted",
};

export default function UserRow({ user, isSelf }: { user: U; isSelf: boolean }) {
  const [showReset, setShowReset] = useState(false);

  return (
    <>
      <tr>
        <td>
          <div className="text-[13.5px] font-medium text-ink">
            {user.name}
            {isSelf ? <span className="ml-2 text-[11px] text-ink-muted">(Anda)</span> : null}
          </div>
          <div className="mono text-[11.5px] text-ink-muted">{user.email}</div>
        </td>
        <td>
          {isSelf ? (
            <span className={`badge ${ROLE_BADGE[user.role] ?? "badge-muted"}`}>
              {ROLE_LABELS[user.role as Role] ?? user.role}
            </span>
          ) : (
            <form action={updateUserRole.bind(null, user.id)} className="flex items-center gap-2">
              <select
                name="role"
                defaultValue={user.role}
                className="input h-8 w-auto py-1 text-[12.5px]"
                aria-label={`Peran ${user.name}`}
              >
                {ROLES.slice().reverse().map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <button type="submit" className="btn-secondary btn-sm">Simpan</button>
            </form>
          )}
        </td>
        <td className="text-[12.5px] text-ink-muted">{user.createdAt}</td>
        <td className="text-right">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setShowReset((s) => !s)}
              className="btn-ghost"
              aria-expanded={showReset}
            >
              <KeyRound className="h-3.5 w-3.5" /> Reset Sandi
            </button>
            {!isSelf ? (
              <form action={deleteUser.bind(null, user.id)}>
                <ConfirmSubmit
                  className="btn-ghost text-danger-text hover:bg-danger-bg"
                  message={`Hapus pengguna "${user.name}"? Tindakan ini tidak dapat dibatalkan.`}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </ConfirmSubmit>
              </form>
            ) : null}
          </div>
        </td>
      </tr>
      {showReset ? (
        <tr>
          <td colSpan={4} className="bg-canvas/60">
            <form
              action={resetUserPassword.bind(null, user.id)}
              className="flex flex-wrap items-end gap-2"
            >
              <div>
                <label className="label">Kata sandi baru untuk {user.name}</label>
                <input
                  name="password"
                  type="password"
                  minLength={6}
                  required
                  className="input w-64"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <button type="submit" className="btn btn-sm">Simpan Sandi</button>
              <button type="button" onClick={() => setShowReset(false)} className="btn-secondary btn-sm">
                Batal
              </button>
            </form>
          </td>
        </tr>
      ) : null}
    </>
  );
}
