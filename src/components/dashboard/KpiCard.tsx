import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "default" | "warn" | "danger" | "ok";

export default function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  href?: string;
}) {
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
        <div className={cn("text-[11.5px] font-semibold uppercase tracking-widest2", labelColor)}>
          {label}
        </div>
        <div className={cn("grid h-8 w-8 place-items-center rounded-md", iconBg)}>
          <Icon className="h-[15px] w-[15px]" strokeWidth={2.25} />
        </div>
      </div>
      <div className={cn("mt-3 text-[28px] font-bold leading-none tracking-tight", valueColor)}>
        {value}
      </div>
      {hint ? (
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
          "group block cursor-pointer outline-none transition focus-visible:ring-2 focus-visible:ring-accent/40"
        )}
      >
        <div className="relative">
          <ArrowUpRight className="absolute -right-1 -top-1 h-4 w-4 text-ink-subtle opacity-0 transition group-hover:opacity-100" />
        </div>
        {body}
      </Link>
    );
  }

  return <div className={cardCls}>{body}</div>;
}
