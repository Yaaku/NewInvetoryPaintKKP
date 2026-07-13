import { formatNumber } from "@/lib/utils";
import type { MonthFlow } from "@/lib/dashboard-metrics";

/**
 * Grouped bar chart of stock in vs out per month. Pure inline SVG (no library),
 * themed with semantic CSS-variable tokens so it works in light and dark mode.
 */
export default function StockFlowChart({ data }: { data: MonthFlow[] }) {
  const W = 640;
  const H = 260;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const max = Math.max(1, ...data.flatMap((d) => [d.masuk, d.keluar]));
  // round the axis max up to a "nice" number
  const step = niceStep(max);
  const axisMax = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: axisMax / step + 1 }, (_, i) => i * step);

  const groupW = plotW / data.length;
  const barW = Math.min(26, groupW / 3.2);
  const y = (v: number) => padT + plotH - (v / axisMax) * plotH;

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-[12px]">
        <Legend colorVar="--accent" label="Barang Masuk" />
        <Legend colorVar="--warn-solid" label="Barang Keluar" />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
        aria-label="Grafik barang masuk dan keluar per bulan">
        {/* gridlines + y labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t)}
              y2={y(t)}
              style={{ stroke: "rgb(var(--line))" }}
              strokeWidth={1}
            />
            <text
              x={padL - 8}
              y={y(t) + 4}
              textAnchor="end"
              style={{ fill: "rgb(var(--ink-subtle))" }}
              fontSize={10}
            >
              {compact(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const gx = padL + i * groupW + groupW / 2;
          return (
            <g key={d.label}>
              <rect
                x={gx - barW - 2}
                y={y(d.masuk)}
                width={barW}
                height={padT + plotH - y(d.masuk)}
                rx={2}
                style={{ fill: "rgb(var(--accent))" }}
              >
                <title>{`${d.label} · Masuk ${formatNumber(d.masuk)}`}</title>
              </rect>
              <rect
                x={gx + 2}
                y={y(d.keluar)}
                width={barW}
                height={padT + plotH - y(d.keluar)}
                rx={2}
                style={{ fill: "rgb(var(--warn-solid))" }}
              >
                <title>{`${d.label} · Keluar ${formatNumber(d.keluar)}`}</title>
              </rect>
              <text
                x={gx}
                y={H - padB + 18}
                textAnchor="middle"
                style={{ fill: "rgb(var(--ink-muted))" }}
                fontSize={11}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Legend({ colorVar, label }: { colorVar: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-muted">
      <span
        className="inline-block h-3 w-3 rounded-sm"
        style={{ backgroundColor: `rgb(var(${colorVar}))` }}
      />
      {label}
    </span>
  );
}

function niceStep(max: number): number {
  const rough = max / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rough || 1)));
  const norm = rough / pow;
  const mult = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return Math.max(1, mult * pow);
}

function compact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}rb`;
  return String(n);
}
