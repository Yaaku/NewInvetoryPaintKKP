import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Server-rendered pagination. Preserves all current filters (passed via
 * `params`) and only swaps the `page` value. Renders nothing when there is a
 * single page.
 */
export default function Pagination({
  basePath,
  page,
  pageCount,
  total,
  pageSize,
  params,
}: {
  basePath: string;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  params: Record<string, string | undefined>;
}) {
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v && k !== "page") sp.set(k, v);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const windowPages = pageWindow(page, pageCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
      <p className="text-[12.5px] text-ink-muted">
        Menampilkan <span className="font-medium text-ink-soft">{from}</span>–
        <span className="font-medium text-ink-soft">{to}</span> dari{" "}
        <span className="font-medium text-ink-soft">{total}</span>
      </p>

      {pageCount > 1 ? (
        <nav className="flex items-center gap-1" aria-label="Navigasi halaman">
          <PageLink href={href(page - 1)} disabled={page <= 1} aria-label="Sebelumnya">
            <ChevronLeft className="h-4 w-4" />
          </PageLink>

          {windowPages.map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1.5 text-[13px] text-ink-subtle">
                …
              </span>
            ) : (
              <PageLink key={p} href={href(p)} active={p === page}>
                {p}
              </PageLink>
            )
          )}

          <PageLink href={href(page + 1)} disabled={page >= pageCount} aria-label="Berikutnya">
            <ChevronRight className="h-4 w-4" />
          </PageLink>
        </nav>
      ) : null}
    </div>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const cls =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[13px] font-medium transition";
  if (disabled) {
    return (
      <span
        aria-disabled
        className={`${cls} cursor-not-allowed border-line bg-canvas text-ink-subtle opacity-60`}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      prefetch={false}
      {...rest}
      className={`${cls} ${
        active
          ? "border-accent bg-accent text-white"
          : "border-line bg-surface text-ink-soft hover:bg-canvas"
      }`}
    >
      {children}
    </Link>
  );
}

/** Compact page window: 1 … (p-1) p (p+1) … N */
function pageWindow(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}
