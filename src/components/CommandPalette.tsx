"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ChevronRight,
  ClipboardList,
  ClipboardCheck,
  History,
  LayoutDashboard,
  PackagePlus,
  Paintbrush,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavCommand = {
  kind: "navigation";
  id: string;
  label: string;
  description: string;
  href: string;
  Icon: LucideIcon;
  keywords?: string[];
};
type ActionCommand = {
  kind: "action";
  id: string;
  label: string;
  description: string;
  href: string;
  Icon: LucideIcon;
  keywords?: string[];
  group: "Buat";
};
type ProductHit = {
  kind: "product";
  id: number;
  name: string;
  sku: string;
  unit: string;
};
type SupplierHit = {
  kind: "supplier";
  id: number;
  name: string;
};

type Item =
  | (NavCommand | ActionCommand)
  | (ProductHit & { group: "Produk" | "Supplier" });

const NAVIGATION: NavCommand[] = [
  { kind: "navigation", id: "nav-dashboard", label: "Dashboard", description: "Ringkasan stok & peringatan", href: "/dashboard", Icon: LayoutDashboard, keywords: ["home", "beranda", "ringkasan"] },
  { kind: "navigation", id: "nav-products", label: "Produk", description: "Daftar produk & SKU", href: "/products", Icon: Boxes, keywords: ["barang", "sku"] },
  { kind: "navigation", id: "nav-suppliers", label: "Supplier", description: "Daftar supplier aktif", href: "/suppliers", Icon: Truck, keywords: ["pemasok", "vendor"] },
  { kind: "navigation", id: "nav-stock-in", label: "Stok Masuk", description: "Penerimaan barang dari supplier", href: "/stock-in", Icon: ArrowDownToLine, keywords: ["inbound", "penerimaan", "po"] },
  { kind: "navigation", id: "nav-stock-out", label: "Stok Keluar", description: "Penjualan & pengeluaran stok", href: "/stock-out", Icon: ArrowUpFromLine, keywords: ["outbound", "penjualan"] },
  { kind: "navigation", id: "nav-tinting", label: "Tinting", description: "Pencampuran warna cat", href: "/tinting", Icon: Paintbrush, keywords: ["warna", "racik"] },
  { kind: "navigation", id: "nav-adjustments", label: "Penyesuaian", description: "Koreksi stok manual", href: "/adjustments", Icon: SlidersHorizontal, keywords: ["adjustment", "koreksi"] },
  { kind: "navigation", id: "nav-opname", label: "Stock Opname", description: "Hitung fisik stok gudang", href: "/opname", Icon: ClipboardCheck, keywords: ["audit", "hitung"] },
  { kind: "navigation", id: "nav-reorder", label: "Saran Restock", description: "Rekomendasi pembelian ulang", href: "/reorder", Icon: ShoppingCart, keywords: ["reorder", "beli ulang"] },
  { kind: "navigation", id: "nav-purchase-orders", label: "Purchase Order", description: "Daftar pesanan pembelian", href: "/purchase-orders", Icon: ClipboardList, keywords: ["po", "pesanan"] },
  { kind: "navigation", id: "nav-movements", label: "Riwayat", description: "Semua pergerakan stok", href: "/movements", Icon: History, keywords: ["history", "mutasi"] },
  { kind: "navigation", id: "nav-reports", label: "Laporan", description: "Nilai inventaris & penjualan", href: "/reports", Icon: ShoppingCart, keywords: ["report", "analitik"] },
  { kind: "navigation", id: "nav-users", label: "Pengguna", description: "Manajemen user & role", href: "/users", Icon: Users, keywords: ["user", "admin"] },
];

const ACTIONS: ActionCommand[] = [
  {
    kind: "action",
    id: "act-new-product",
    label: "Buat Produk Baru",
    description: "Tambah produk / SKU baru",
    href: "/products/new",
    Icon: PackagePlus,
    keywords: ["tambah", "new"],
    group: "Buat",
  },
  {
    kind: "action",
    id: "act-new-po",
    label: "Buat Purchase Order",
    description: "Pesan stok ke supplier",
    href: "/purchase-orders/new",
    Icon: ClipboardList,
    keywords: ["po", "pesan"],
    group: "Buat",
  },
  {
    kind: "action",
    id: "act-new-stock-in",
    label: "Catat Stok Masuk",
    description: "Penerimaan barang",
    href: "/stock-in",
    Icon: ArrowDownToLine,
    keywords: ["inbound", "penerimaan"],
    group: "Buat",
  },
  {
    kind: "action",
    id: "act-new-stock-out",
    label: "Catat Stok Keluar",
    description: "Pengeluaran / penjualan",
    href: "/stock-out",
    Icon: ArrowUpFromLine,
    keywords: ["outbound", "penjualan"],
    group: "Buat",
  },
];

const OPEN_EVENT = "open-command-palette";

export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT));
  }
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [products, setProducts] = useState<ProductHit[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global ⌘K / Ctrl+K + custom event to open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen as EventListener);
    };
  }, []);

  // Lock body scroll + focus input when opened.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Reset state on close.
  useEffect(() => {
    if (open) return;
    setQ("");
    setActive(0);
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length === 0) {
      setProducts([]);
      setSuppliers([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { products: ProductHit[]; suppliers: SupplierHit[] };
        if (cancelled) return;
        setProducts(data.products);
        setSuppliers(data.suppliers);
        setActive(0);
      } catch {
        if (!cancelled) {
          setProducts([]);
          setSuppliers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, open]);

  const sections = useMemo(() => {
    const term = q.trim().toLowerCase();
    const matchText = (s: string) => term === "" || s.toLowerCase().includes(term);

    const matchedNav = NAVIGATION.filter(
      (n) =>
        matchText(n.label) ||
        matchText(n.description) ||
        n.keywords?.some((k) => matchText(k))
    );
    const matchedActions = ACTIONS.filter(
      (a) =>
        matchText(a.label) ||
        matchText(a.description) ||
        a.keywords?.some((k) => matchText(k))
    );

    const result: Array<{ key: string; title: string; items: Array<{ key: string; render: () => React.ReactNode; onSelect: () => void }> }> = [];

    if (term === "") {
      result.push({
        key: "nav",
        title: "Halaman",
        items: NAVIGATION.slice(0, 6).map((n) => ({
          key: n.id,
          render: () => <PaletteRow Icon={n.Icon} title={n.label} subtitle={n.description} />,
          onSelect: () => router.push(n.href),
        })),
      });
      result.push({
        key: "act",
        title: "Aksi Cepat",
        items: ACTIONS.map((a) => ({
          key: a.id,
          render: () => <PaletteRow Icon={a.Icon} title={a.label} subtitle={a.description} />,
          onSelect: () => router.push(a.href),
        })),
      });
    } else {
      if (matchedNav.length) {
        result.push({
          key: "nav",
          title: "Halaman",
          items: matchedNav.map((n) => ({
            key: n.id,
            render: () => <PaletteRow Icon={n.Icon} title={n.label} subtitle={n.description} />,
            onSelect: () => router.push(n.href),
          })),
        });
      }
      if (matchedActions.length) {
        result.push({
          key: "act",
          title: "Aksi Cepat",
          items: matchedActions.map((a) => ({
            key: a.id,
            render: () => <PaletteRow Icon={a.Icon} title={a.label} subtitle={a.description} />,
            onSelect: () => router.push(a.href),
          })),
        });
      }
      if (products.length) {
        result.push({
          key: "prod",
          title: "Produk",
          items: products.map((p) => ({
            key: `p-${p.id}`,
            render: () => <PaletteRow Icon={Boxes} title={p.name} subtitle={`SKU ${p.sku}`} right={`${p.unit}`} />,
            onSelect: () => router.push(`/products/${p.id}`),
          })),
        });
      }
      if (suppliers.length) {
        result.push({
          key: "sup",
          title: "Supplier",
          items: suppliers.map((s) => ({
            key: `s-${s.id}`,
            render: () => <PaletteRow Icon={Truck} title={s.name} subtitle="Supplier" />,
            onSelect: () => router.push(`/suppliers/${s.id}`),
          })),
        });
      }
    }
    return result;
  }, [q, products, suppliers, router]);

  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const total = flat.length;

  function runIndex(i: number) {
    const item = flat[i];
    if (!item) return;
    item.onSelect();
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (total === 0 ? 0 : (a + 1) % total));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (total === 0 ? 0 : (a - 1 + total) % total));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      runIndex(active);
      return;
    }
  }

  // Scroll active row into view.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-cp-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  if (!open) return null;

  let running = 0;
  const empty = total === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Palet perintah"
      onKeyDown={onKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search className="h-4 w-4 text-ink-subtle" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder="Cari produk, supplier, atau ketik perintah…"
            aria-label="Cari"
            className="h-12 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-subtle"
          />
          <kbd className="hidden rounded border border-line bg-canvas px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-muted md:inline-block">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          {empty ? (
            <div className="px-4 py-12 text-center text-[13px] text-ink-muted">
              {loading
                ? "Mencari…"
                : q.trim()
                ? `Tidak ada hasil untuk "${q.trim()}"`
                : "Mulai mengetik untuk mencari…"}
            </div>
          ) : (
            sections.map((s) => (
              <div key={s.key} className="py-1.5">
                <div className="px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-widest2 text-ink-muted">
                  {s.title}
                </div>
                <ul>
                  {s.items.map((it) => {
                    const i = running++;
                    const isActive = i === active;
                    return (
                      <li key={it.key}>
                        <button
                          type="button"
                          data-cp-index={i}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => runIndex(i)}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2 text-left text-[13.5px] transition-colors",
                            isActive ? "bg-accent-soft" : "hover:bg-canvas"
                          )}
                        >
                          {it.render()}
                          <ChevronRight className="ml-auto h-3.5 w-3.5 text-ink-subtle" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line bg-canvas/60 px-4 py-2 text-[11px] text-ink-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-semibold text-ink-muted">↑</kbd>
              <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-semibold text-ink-muted">↓</kbd>
              navigasi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-semibold text-ink-muted">↵</kbd>
              buka
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-semibold text-ink-muted">Esc</kbd>
              tutup
            </span>
          </div>
          <span className="font-semibold uppercase tracking-widest2 text-ink-subtle">
            Berger Paint
          </span>
        </div>
      </div>
    </div>
  );
}

function PaletteRow({
  Icon,
  title,
  subtitle,
  right,
}: {
  Icon: LucideIcon;
  title: string;
  subtitle?: string;
  right?: string;
}) {
  return (
    <>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-canvas text-ink-muted">
        <Icon className="h-[15px] w-[15px]" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{title}</span>
        {subtitle ? (
          <span className="block truncate text-[12px] text-ink-muted">{subtitle}</span>
        ) : null}
      </span>
      {right ? (
        <span className="mono ml-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {right}
        </span>
      ) : null}
    </>
  );
}
