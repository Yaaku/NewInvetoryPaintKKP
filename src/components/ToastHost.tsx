"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

function ToastReader({ onFlash }: { onFlash: (msg: string, type: ToastType) => void }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const flash = params.get("flash");
    if (!flash) return;
    const type = (params.get("flashType") as ToastType) || "success";
    onFlash(flash, type);
    // Strip the flash params from the URL without adding history.
    const next = new URLSearchParams(params.toString());
    next.delete("flash");
    next.delete("flashType");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router, onFlash]);

  return null;
}

export default function ToastHost() {
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  // Stable identity — an inline arrow here re-triggers ToastReader's effect on
  // every render, looping setState until React aborts ("Maximum update depth").
  const onFlash = useCallback((msg: string, type: ToastType) => setToast({ msg, type }), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const styles: Record<ToastType, string> = {
    success: "border-ok-border bg-ok-bg text-ok-text",
    error: "border-danger-border bg-danger-bg text-danger-text",
    info: "border-accent-border bg-accent-soft text-accent-text",
  };
  const Icon =
    toast?.type === "error" ? TriangleAlert : toast?.type === "info" ? Info : CheckCircle2;

  return (
    <>
      <Suspense fallback={null}>
        <ToastReader onFlash={onFlash} />
      </Suspense>
      {toast ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex justify-end">
          <div
            role="status"
            className={`pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-lg border px-4 py-3 shadow-soft ${styles[toast.type]}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="text-[13px] font-medium leading-snug">{toast.msg}</div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-1 shrink-0 rounded p-0.5 opacity-60 transition hover:opacity-100"
              aria-label="Tutup"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
