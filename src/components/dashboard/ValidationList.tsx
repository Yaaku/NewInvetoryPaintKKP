"use client";

import { ArrowDownToLine, ArrowUpFromLine, Check, TriangleAlert } from "lucide-react";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { verifyMovement, flagMovement } from "@/app/(app)/validation/actions";

export type ValidationItem = {
  id: number;
  type: "INBOUND" | "OUTBOUND";
  quantity: number;
  reason: string;
  productName: string;
  productSku: string;
  productUnit: string;
  batchNumber: string | null;
  userName: string;
  createdAt: Date;
  status: string;
  verifierName: string | null;
  verifiedAt: Date | null;
  note: string | null;
};

export default function ValidationList({
  items,
  showActions = true,
  emptyText = "Tidak ada transaksi untuk divalidasi.",
}: {
  items: ValidationItem[];
  showActions?: boolean;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return <div className="px-5 py-12 text-center text-[13px] text-ink-muted">{emptyText}</div>;
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((m) => {
        const inbound = m.type === "INBOUND";
        return (
          <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
                inbound ? "bg-ok-bg text-ok-text" : "bg-warn-softer text-warn-text"
              }`}
            >
              {inbound ? (
                <ArrowDownToLine className="h-4 w-4" />
              ) : (
                <ArrowUpFromLine className="h-4 w-4" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-medium text-ink">
                {m.productName}{" "}
                <span className="mono text-[11px] uppercase text-ink-subtle">{m.productSku}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-muted">
                <span className={`font-semibold ${inbound ? "text-ok-text" : "text-warn-text"}`}>
                  {inbound ? "Masuk" : "Keluar"} {formatNumber(Math.abs(m.quantity))} {m.productUnit}
                </span>
                <span className="text-ink-faint">•</span>
                <span>{m.reason}</span>
                {m.batchNumber ? (
                  <>
                    <span className="text-ink-faint">•</span>
                    <span className="mono">#{m.batchNumber}</span>
                  </>
                ) : null}
                <span className="text-ink-faint">•</span>
                <span>oleh {m.userName}</span>
                <span className="text-ink-faint">•</span>
                <span>{formatDateTime(m.createdAt)}</span>
              </div>
              {m.status === "flagged" && m.note ? (
                <div className="mt-1 text-[12px] text-danger-text">Catatan: {m.note}</div>
              ) : null}
            </div>

            {showActions ? (
              <div className="flex shrink-0 items-center gap-2">
                <form action={verifyMovement}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="btn btn-sm">
                    <Check className="h-3.5 w-3.5" /> Verifikasi
                  </button>
                </form>
                <form action={flagMovement}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="btn-danger-outline btn-sm">
                    <TriangleAlert className="h-3.5 w-3.5" /> Bermasalah
                  </button>
                </form>
              </div>
            ) : (
              <StatusBadge status={m.status} verifierName={m.verifierName} verifiedAt={m.verifiedAt} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function StatusBadge({
  status,
  verifierName,
  verifiedAt,
}: {
  status: string;
  verifierName: string | null;
  verifiedAt: Date | null;
}) {
  if (status === "verified") {
    return (
      <div className="shrink-0 text-right">
        <span className="badge badge-ok px-2 py-0.5">Terverifikasi</span>
        {verifierName ? (
          <div className="mt-1 text-[11px] text-ink-muted">
            {verifierName}
            {verifiedAt ? ` · ${formatDateTime(verifiedAt)}` : ""}
          </div>
        ) : null}
      </div>
    );
  }
  if (status === "flagged") {
    return (
      <div className="shrink-0 text-right">
        <span className="pill-danger">Bermasalah</span>
        {verifierName ? (
          <div className="mt-1 text-[11px] text-ink-muted">{verifierName}</div>
        ) : null}
      </div>
    );
  }
  return <span className="pill-warn shrink-0">Menunggu</span>;
}
