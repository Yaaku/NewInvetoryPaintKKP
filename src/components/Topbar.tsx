import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import MobileNav from "@/components/MobileNav";
import SearchBox from "@/components/SearchBox";
import NotificationBell, { type Notification } from "@/components/NotificationBell";
import { prisma } from "@/lib/db";
import { NEAR_EXPIRY_DAYS, formatDate } from "@/lib/utils";

async function buildNotifications(): Promise<Notification[]> {
  const now = new Date();
  const nearThreshold = new Date();
  nearThreshold.setDate(now.getDate() + NEAR_EXPIRY_DAYS);

  const [expired, nearExpiry, products] = await Promise.all([
    prisma.batch.findMany({
      where: { quantity: { gt: 0 }, expiryDate: { lt: now } },
      include: { product: { select: { id: true, name: true, unit: true } } },
      orderBy: { expiryDate: "asc" },
      take: 5,
    }),
    prisma.batch.findMany({
      where: { quantity: { gt: 0 }, expiryDate: { gte: now, lte: nearThreshold } },
      include: { product: { select: { id: true, name: true, unit: true } } },
      orderBy: { expiryDate: "asc" },
      take: 5,
    }),
    prisma.product.findMany({
      where: { isActive: true, currentStock: { lte: prisma.product.fields.minStock } },
      orderBy: { currentStock: "asc" },
      take: 8,
    }),
  ]);

  const notifications: Notification[] = [];

  for (const b of expired) {
    notifications.push({
      id: `exp-${b.id}`,
      type: "expired",
      title: `Kedaluwarsa: ${b.product.name}`,
      detail: `Batch ${b.batchNumber} · ${b.quantity}${b.product.unit}`,
      href: "/movements?reason=expired",
    });
  }
  for (const b of nearExpiry) {
    notifications.push({
      id: `near-${b.id}`,
      type: "nearExpiry",
      title: `Mendekati kedaluwarsa: ${b.product.name}`,
      detail: `Batch ${b.batchNumber} · exp ${formatDate(b.expiryDate)}`,
      href: "/reports",
    });
  }
  for (const p of products) {
    const out = p.currentStock <= 0;
    notifications.push({
      id: `stk-${p.id}`,
      type: out ? "out" : "low",
      title: `${out ? "Stok habis" : "Stok menipis"}: ${p.name}`,
      detail: `Sisa ${p.currentStock}${p.unit} (min ${p.minStock}${p.unit})`,
      href: `/stock-in?productId=${p.id}`,
    });
  }

  return notifications;
}

export default async function Topbar({
  userName,
  email,
  canManageUsers = false,
  canProcure = false,
  isStaff = false,
}: {
  userName: string;
  email: string;
  canManageUsers?: boolean;
  canProcure?: boolean;
  isStaff?: boolean;
}) {
  const initial = (userName?.trim()?.[0] ?? "A").toUpperCase();
  const notifications = await buildNotifications();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur-sm md:px-6">
      <MobileNav canManageUsers={canManageUsers} canProcure={canProcure} isStaff={isStaff} />
      <SearchBox />

      <div className="ml-auto flex items-center gap-1">
        <NotificationBell items={notifications} />
        <Link
          href="/settings"
          aria-label="Pengaturan"
          className="relative grid h-9 w-9 place-items-center rounded-md text-ink-muted transition hover:bg-canvas hover:text-ink"
        >
          <Settings className="h-[18px] w-[18px]" />
        </Link>
        <div className="mx-2 h-6 w-px bg-line" />
        <div className="hidden text-right md:block">
          <div className="text-[13px] font-semibold leading-tight text-ink">{userName}</div>
          <div className="text-[11px] text-ink-muted">{email}</div>
        </div>
        <div className="ml-2 grid h-9 w-9 place-items-center rounded-full bg-accent text-[13px] font-semibold text-white">
          {initial}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Keluar"
            className="ml-1 grid h-9 w-9 place-items-center rounded-md text-ink-muted transition hover:bg-canvas hover:text-ink"
          >
            <LogOut className="h-[16px] w-[16px]" />
          </button>
        </form>
      </div>
    </header>
  );
}
