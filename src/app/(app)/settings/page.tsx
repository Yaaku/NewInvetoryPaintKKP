import { User, Database, SlidersHorizontal, ShieldCheck, LogOut, Palette } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatNumber, NEAR_EXPIRY_DAYS } from "@/lib/utils";
import { logoutAction } from "@/app/login/actions";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();

  const [user, productCount, supplierCount, batchCount, movementCount] = await Promise.all([
    session.userId ? prisma.user.findUnique({ where: { id: session.userId } }) : null,
    prisma.product.count(),
    prisma.supplier.count(),
    prisma.batch.count(),
    prisma.stockMovement.count(),
  ]);

  const roleLabel: Record<string, string> = {
    admin: "Admin Gudang",
    owner: "Pemilik",
    manager: "Manajer Toko",
    staff: "Staf Operasional",
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-headline-lg font-sans">Pengaturan</h1>
        <p className="text-body-sm font-sans text-on-surface-variant">
          Informasi akun, konfigurasi sistem, dan ringkasan data.
        </p>
      </header>

      {/* Appearance */}
      <section className="panel">
        <header className="panel-header">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-ink-muted" />
            <h2 className="panel-title">Tampilan</h2>
          </div>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <div className="text-[14px] font-medium text-ink">Tema</div>
            <div className="text-[12.5px] text-ink-muted">
              Pilih tampilan terang, gelap, atau ikuti pengaturan sistem.
            </div>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Account */}
        <section className="panel">
          <header className="panel-header">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-ink-muted" />
              <h2 className="panel-title">Akun</h2>
            </div>
          </header>
          <dl className="divide-y divide-line">
            <Row label="Nama" value={user?.name ?? session.name ?? "—"} />
            <Row label="Email" value={user?.email ?? session.email ?? "—"} />
            <Row
              label="Peran"
              value={
                <span className="badge badge-info">
                  <ShieldCheck className="h-3 w-3" />
                  {roleLabel[user?.role ?? "admin"] ?? user?.role ?? "Admin"}
                </span>
              }
            />
          </dl>
          <div className="border-t border-line p-4">
            <form action={logoutAction}>
              <button type="submit" className="btn-secondary">
                <LogOut className="h-4 w-4" /> Keluar dari sesi
              </button>
            </form>
          </div>
        </section>

        {/* System config */}
        <section className="panel">
          <header className="panel-header">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-ink-muted" />
              <h2 className="panel-title">Konfigurasi Sistem</h2>
            </div>
          </header>
          <dl className="divide-y divide-line">
            <Row label="Ambang mendekati kedaluwarsa" value={`${NEAR_EXPIRY_DAYS} hari`} />
            <Row label="Aturan stok menipis" value="Stok ≤ stok minimum per produk" />
            <Row label="Metode pengeluaran stok" value="FEFO (ada kedaluwarsa) / FIFO" />
            <Row label="Mata uang" value="Rupiah (IDR)" />
            <Row label="Bahasa antarmuka" value="Bahasa Indonesia" />
          </dl>
        </section>

        {/* Data summary */}
        <section className="panel lg:col-span-2">
          <header className="panel-header">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-ink-muted" />
              <h2 className="panel-title">Ringkasan Data</h2>
            </div>
            <span className="text-[11.5px] text-ink-muted">Penyimpanan: SQLite</span>
          </header>
          <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
            <Stat label="Produk" value={formatNumber(productCount)} />
            <Stat label="Supplier" value={formatNumber(supplierCount)} />
            <Stat label="Batch" value={formatNumber(batchCount)} />
            <Stat label="Catatan Pergerakan" value={formatNumber(movementCount)} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-[13px] text-ink-muted">{label}</dt>
      <dd className="text-[13.5px] font-medium text-ink">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest2 text-ink-muted">{label}</div>
      <div className="mt-1.5 text-[22px] font-bold leading-none text-ink">{value}</div>
    </div>
  );
}
