import { UserPlus, Users as UsersIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { createUser } from "./actions";
import UserRow from "./UserRow";
import CreateUserForm from "./CreateUserForm";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const actor = await requireCapability("users.manage");

  const users = await prisma.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-headline-lg font-sans">Pengguna</h1>
          <p className="text-body-sm font-sans text-on-surface-variant">
            Kelola akun, peran, dan akses tim gudang.
          </p>
        </div>
      </header>

      {/* Role legend */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ROLES.slice().reverse().map((r) => (
          <div key={r} className="rounded-xl border border-line bg-surface p-4">
            <div className="text-[13px] font-semibold text-ink">{ROLE_LABELS[r]}</div>
            <div className="mt-1 text-[12px] text-ink-muted">{ROLE_DESCRIPTIONS[r]}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User list */}
        <section className="panel lg:col-span-2">
          <header className="panel-header">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-ink-muted" />
              <h2 className="panel-title">Daftar Pengguna ({users.length})</h2>
            </div>
          </header>
          <div className="overflow-x-auto">
            <table className="tbl tbl-sticky tbl-compact">
              <thead>
                <tr>
                  <th>Nama / Email</th>
                  <th>Peran</th>
                  <th>Dibuat</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={{
                      id: u.id,
                      name: u.name,
                      email: u.email,
                      role: u.role,
                      createdAt: formatDate(u.createdAt),
                    }}
                    isSelf={u.id === actor.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Create user */}
        <section className="panel h-fit">
          <header className="panel-header">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-ink-muted" />
              <h2 className="panel-title">Tambah Pengguna</h2>
            </div>
          </header>
          <div className="p-4">
            <CreateUserForm action={createUser} />
          </div>
        </section>
      </div>
    </div>
  );
}
