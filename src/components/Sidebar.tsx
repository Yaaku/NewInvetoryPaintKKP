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
}: {
  canManageUsers?: boolean;
  canProcure?: boolean;
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

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-surface md:flex md:flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-white shadow-sm">
          <Palette className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold leading-tight tracking-tight text-ink">
            InventoryCat
          </div>
          <div className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">
            Admin Gudang
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {groups.map((g) => (
          <div key={g.label} className="mb-1">
            <div className="nav-group-label">{g.label}</div>
            <ul className="space-y-0.5">
              {g.items.map((n) => {
                const active = pathname === n.href || pathname.startsWith(n.href + "/");
                const Icon = n.icon;
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
                      <span>{n.label}</span>
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
