"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, AlertOctagon, AlertTriangle, Clock, PackageX } from "lucide-react";

export type Notification = {
  id: string;
  type: "expired" | "nearExpiry" | "out" | "low";
  title: string;
  detail: string;
  href: string;
};

const META = {
  expired: { Icon: AlertOctagon, cls: "text-danger-solid bg-danger-softer" },
  out: { Icon: PackageX, cls: "text-danger-solid bg-danger-softer" },
  nearExpiry: { Icon: Clock, cls: "text-warn-solid bg-warn-softer" },
  low: { Icon: AlertTriangle, cls: "text-warn-solid bg-warn-softer" },
} as const;

export default function NotificationBell({ items }: { items: Notification[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = items.length;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Notifikasi (${count})`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-md text-ink-muted transition hover:bg-canvas hover:text-ink"
      >
        <Bell className="h-[18px] w-[18px]" />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger-solid px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-[13px] font-semibold text-ink">Notifikasi</span>
            <span className="text-[11px] text-ink-muted">{count} perlu perhatian</span>
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {count === 0 ? (
              <div className="px-4 py-10 text-center text-[13px] text-ink-muted">
                Tidak ada notifikasi. Semua aman 🎉
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {items.map((n) => {
                  const { Icon, cls } = META[n.type];
                  return (
                    <li key={n.id}>
                      <Link
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 transition hover:bg-canvas"
                      >
                        <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md ${cls}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium text-ink">{n.title}</span>
                          <span className="block text-[12px] text-ink-muted">{n.detail}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <Link
            href="/reorder"
            onClick={() => setOpen(false)}
            className="block border-t border-line bg-canvas/60 px-4 py-2.5 text-center text-[12px] font-semibold text-accent hover:text-accent-hover"
          >
            Lihat saran restock
          </Link>
        </div>
      ) : null}
    </div>
  );
}
