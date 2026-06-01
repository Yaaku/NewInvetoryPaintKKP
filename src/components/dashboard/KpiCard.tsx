import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "default" | "warn" | "danger" | "ok";

export default function KpiCard({
  label,
  value,
  hint,
  context,
  delta,
  icon: Icon,
  tone = "default",
  priority = "normal",
  href,
}: {
  label: string;
  value: string | number;
  hint?: React.ReactNode;
  context?: React.ReactNode;
  /** Signed change vs previous period (e.g. 0.12 = +12%, -0.05 = -5%). */
  delta?: number;
  icon: LucideIcon;
  tone?: Tone;
  /** "critical" renders a larger, more prominent card for top-priority signals. */
  priority?: "normal" | "critical";
  href?: string;
}) {
  const isCritical = priority === "critical";
  const cardCls =
    tone === "warn" ? "kpi-warn" :
    tone === "danger" ? "kpi-danger" :
    tone === "ok" ? "kpi-ok" : "kpi";

  const labelColor =
    tone === "warn" ? "text-warn-text" :
    tone === "danger" ? "text-danger-text" :
    tone === "ok" ? "text-ok-text" :
    "text-ink-muted";

  const valueColor =
    tone === "warn" ? "text-warn-textStrong" :
    tone === "danger" ? "text-danger-textStrong" :
    tone === "ok" ? "text-ok-text" :
    "text-ink";

  const iconBg =
    tone === "warn" ? "bg-warn-softer text-warn-text" :
    tone === "danger" ? "bg-danger-softer text-danger-text" :
    tone === "ok" ? "bg-ok-bg text-ok-text" :
    "bg-canvas text-ink-muted";

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isCritical ? (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-widest2",
                tone === "danger" && "bg-danger-solid/15 text-danger-text",
                tone === "warn" && "bg-warn-solid/15 text-warn-textStrong",
                (tone === "default" || tone === "ok") && "bg-canvas text-ink-muted"
              )}
            >
              Prioritas
            </span>
          ) : null}
          <div
            className={cn(
              "font-semibold uppercase tracking-widest2",
              isCritical ? "text-[12.5px]" : "text-[11.5px]",
              labelColor
            )}
          >
            {label}
          </div>
        </div>
        <div
          className={cn(
            "grid place-items-center rounded-md",
            isCritical ? "h-10 w-10" : "h-8 w-8",
            iconBg
          )}
        >
          <Icon
            className={isCritical ? "h-[18px] w-[18px]" : "h-[15px] w-[15px]"}
            strokeWidth={2.25}
          />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div
          className={cn(
            "font-bold leading-none tracking-tight",
            isCritical ? "text-[40px]" : "text-[28px]",
            valueColor
          )}
        >
          {value}
        </div>
        {typeof delta === "number" ? <TrendPill delta={delta} /> : null}
      </div>
      {context ? (
        <div className={cn("mt-2 text-ink-muted", isCritical ? "text-[13px]" : "text-[12px]")}>
          {context}
        </div>
      ) : hint ? (
        <div className="mt-2 flex items-center gap-1 text-[12px] text-ink-muted">{hint}</div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          cardCls,
          "group relative block cursor-pointer outline-none transition focus-visible:ring-2 focus-visible:ring-accent/40",
          isCritical ? "p-6" : "p-5"
        )}
      >
        <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-ink-subtle opacity-0 transition group-hover:opacity-100" />
        {body}
      </Link>
    );
  }

  return (
    <div className={cn(cardCls, "relative", isCritical && "p-6")}>{body}</div>
  );
}

function TrendPill({ delta }: { delta: number }) {
  const pct = Math.round(delta * 100);
  const positive = pct > 0;
  const negative = pct < 0;
  const Arrow = positive ? ArrowUp : negative ? ArrowDown : Minus;
  const tone = positive
    ? "text-ok-text bg-ok-bg border-ok-border"
    : negative
    ? "text-danger-text bg-danger-softer border-danger-border"
    : "text-ink-muted bg-canvas border-line";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10.5px] font-semibold",
        tone
      )}
      title={positive ? "Naik vs periode sebelumnya" : negative ? "Turun vs periode sebelumnya" : "Stabil"}
    >
      <Arrow className="h-3 w-3" />
      {positive ? `+${pct}` : pct}%
    </span>
  );
}
