"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Palette,
  SlidersHorizontal,
  ClipboardCheck,
  History,
  BarChart3,
  ShoppingCart,
  ClipboardList,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const BASE_GROUPS: NavGroup[] = [
  {
    label: "Ringkasan",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Data Master",
    items: [
      { href: "/products", label: "Produk", icon: Boxes },
      { href: "/suppliers", label: "Supplier", icon: Truck },
    ],
  },
  {
    label: "Transaksi",
    items: [
      { href: "/stock-in", label: "Stok Masuk", icon: ArrowDownToLine },
      { href: "/stock-out", label: "Stok Keluar", icon: ArrowUpFromLine },
      { href: "/tinting", label: "Tinting", icon: Palette },
      { href: "/adjustments", label: "Penyesuaian", icon: SlidersHorizontal },
      { href: "/opname", label: "Stock Opname", icon: ClipboardCheck },
    ],
  },
  {
    label: "Pengadaan",
    items: [
      { href: "/reorder", label: "Saran Restock", icon: ShoppingCart },
      { href: "/purchase-orders", label: "Purchase Order", icon: ClipboardList },
    ],
  },
  {
    label: "Audit",
    items: [
      { href: "/movements", label: "Riwayat", icon: History },
      { href: "/reports", label: "Laporan", icon: BarChart3 },
    ],
  },
];

export default function Sidebar({
  canManageUsers = false,
  canProcure = false,
  badges = {},
}: {
  canManageUsers?: boolean;
  canProcure?: boolean;
  badges?: {
    reorder?: number;
    purchaseOrders?: number;
    opname?: number;
    movements?: number;
  };
}) {
  const pathname = usePathname();

  // Hide the Purchase Order link from roles without procurement rights.
  let groups: NavGroup[] = BASE_GROUPS.map((g) =>
    g.label === "Pengadaan" && !canProcure
      ? { ...g, items: g.items.filter((i) => i.href !== "/purchase-orders") }
      : g
  );

  if (canManageUsers) {
    groups = [
      ...groups,
      { label: "Administrasi", items: [{ href: "/users", label: "Pengguna", icon: Users }] },
    ];
  }

  const countFor = (href: string): number | null => {
    let n: number | undefined;
    if (href === "/reorder") n = badges.reorder;
    else if (href === "/purchase-orders") n = badges.purchaseOrders;
    else if (href === "/opname") n = badges.opname;
    else if (href === "/movements") n = badges.movements;
    if (typeof n !== "number" || n <= 0) return null;
    return n;
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-surface md:flex md:flex-col">
      {/* Brand */}
      <Link
        href="/dashboard"
        aria-label="Berger Paint — ke Dashboard"
        className="group flex items-center gap-2.5 border-b border-line px-5 py-4 transition-colors hover:bg-canvas"
      >
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-white shadow-sm transition-transform group-hover:scale-105">
          <Palette className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold leading-tight tracking-tight text-ink">
            Berger Paint
          </div>
          <div className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">
            Admin Gudang
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {groups.map((g) => (
          <div key={g.label} className="mb-1">
            <div className="nav-group-label">{g.label}</div>
            <ul className="space-y-0.5">
              {g.items.map((n) => {
                const active = pathname === n.href || pathname.startsWith(n.href + "/");
                const Icon = n.icon;
                const count = countFor(n.href);
                return (
                  <li key={n.href} className="relative">
                    <Link
                      href={n.href}
                      className={cn("nav-item ml-2", active && "nav-item-active")}
                    >
                      <Icon
                        className={cn(
                          "h-[17px] w-[17px] shrink-0",
                          active ? "text-accent" : "text-ink-muted"
                        )}
                        strokeWidth={active ? 2.25 : 2}
                      />
                      <span className="flex-1 truncate">{n.label}</span>
                      {count !== null ? <NavBadge count={count} active={active} /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-5 py-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-widest2 text-ink-subtle">
          v1.0 · MVP
        </div>
      </div>
    </aside>
  );
}

function NavBadge({ count, active }: { count: number; active: boolean }) {
  const display = count > 99 ? "99+" : String(count);
  return (
    <span
      aria-label={`${count} item perlu perhatian`}
      className={cn(
        "ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-bold leading-none",
        active
          ? "bg-accent text-white"
          : "bg-warn-softer text-warn-textStrong border border-warn-border"
      )}
    >
      {display}
    </span>
  );
}
