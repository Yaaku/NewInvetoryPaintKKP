"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Palette, X } from "lucide-react";
import { useState } from "react";
import { buildNavGroups } from "@/components/Sidebar";
import { cn } from "@/lib/utils";

export default function MobileNav({
  canManageUsers = false,
  canProcure = false,
  canVerify = false,
  isStaff = false,
}: {
  canManageUsers?: boolean;
  canProcure?: boolean;
  canVerify?: boolean;
  isStaff?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const groups = buildNavGroups({ canManageUsers, canProcure, canVerify, isStaff });

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu navigasi"
        className="grid h-9 w-9 place-items-center rounded-md border border-line bg-surface text-ink-muted transition hover:bg-canvas hover:text-ink"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink/35 backdrop-blur-[1px]"
            aria-label="Tutup menu navigasi"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(84vw,320px)] flex-col border-r border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-white shadow-sm">
                  <Palette className="h-[18px] w-[18px]" strokeWidth={2.25} />
                </div>
                <div>
                  <div className="text-[15px] font-bold leading-tight tracking-tight text-ink">
                    Berger Paint
                  </div>
                  <div className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">
                    Admin Gudang
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu navigasi"
                className="grid h-9 w-9 place-items-center rounded-md text-ink-muted transition hover:bg-canvas hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
              {groups.map((g) => (
                <div key={g.label} className="mb-1">
                  <div className="nav-group-label">{g.label}</div>
                  <ul className="space-y-0.5">
                    {g.items.map((n) => {
                      const active = pathname === n.href || pathname.startsWith(n.href + "/");
                      const Icon = n.icon;
                      return (
                        <li key={n.href}>
                          <Link
                            href={n.href}
                            onClick={() => setOpen(false)}
                            className={cn("nav-item", active && "nav-item-active")}
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
          </aside>
        </div>
      ) : null}
    </div>
  );
}
