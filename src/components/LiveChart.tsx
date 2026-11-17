import { useId, useMemo, useState } from "react";
import { usePriceHistory, useQuote, getInstrument, fmtPrice } from "@/lib/trading";
import { cn } from "@/lib/utils";

/**
 * Live paper-trading chart.
 * Pulls a rolling price history from the live tape and redraws on every tick.
 */
export function LiveChart({
  symbol,
  height = 280,
  className,
}: {
  symbol: string;
  height?: number;
  className?: string;
}) {
  const id = useId();
  const data = usePriceHistory(symbol);
  const quote = useQuote(symbol);
  const inst = getInstrument(symbol);
  const [hover, setHover] = useState<number | null>(null);

  const W = 600;
  const H = height;

  const { path, area, pts, min, max } = useMemo(() => {
    if (data.length < 2) {
      return { path: "", area: "", pts: [] as { x: number; y: number; v: number }[], min: 0, max: 0 };
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * W,
      y: H - 12 - ((v - min) / span) * (H - 28),
      v,
    }));
    const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    return { path, area: `${path} L${W},${H} L0,${H} Z`, pts, min, max };
  }, [data, H]);

  const active = hover != null ? pts[hover] : null;
  const last = data[data.length - 1] ?? 0;
  const first = data[0] ?? 0;
  const change = first === 0 ? 0 : ((last - first) / first) * 100;
  const up = change >= 0;

  const stroke = up ? "var(--success)" : "var(--destructive)";

  return (
    <div className={cn("relative", className)}>
      {/* Live price badge */}
      <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full glass px-3 py-1 text-xs">
        <span
          className={cn(
            "size-1.5 rounded-full animate-pulse",
            up ? "bg-success" : "bg-destructive",
          )}
        />
        <span className="num font-medium">
          {inst ? fmtPrice(last, inst.decimals) : last.toFixed(2)}
        </span>
        <span className={cn("num", up ? "text-success" : "text-destructive")}>
          {up ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        style={{ height }}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${symbol} live price chart`}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.round(((e.clientX - r.left) / r.width) * (pts.length - 1));
          setHover(Math.max(0, Math.min(pts.length - 1, i)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`live-f-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={up ? "var(--success)" : "var(--destructive)"}
              stopOpacity="0.28"
            />
            <stop
              offset="100%"
              stopColor={up ? "var(--success)" : "var(--destructive)"}
              stopOpacity="0"
            />
          </linearGradient>
          <filter id={`live-g-${id}`}>
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {path && (
          <>
            <path d={area} fill={`url(#live-f-${id})`} />
            <path
              d={path}
              fill="none"
              stroke={stroke}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#live-g-${id})`}
            />
          </>
        )}

        {/* Current price horizontal guide */}
        {pts.length > 0 && (
          <line
            x1={0}
            y1={pts[pts.length - 1].y}
            x2={W}
            y2={pts[pts.length - 1].y}
            stroke={stroke}
            strokeWidth={0.8}
            strokeDasharray="4 4"
            opacity={0.45}
          />
        )}

        {active && (
          <g>
            <line
              x1={active.x}
              y1={0}
              x2={active.x}
              y2={H}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <circle cx={active.x} cy={active.y} r={4.5} fill={stroke} />
            <text
              x={active.x}
              y={Math.max(16, active.y - 10)}
              textAnchor="middle"
              className="fill-foreground text-[10px]"
              style={{ fontFamily: "var(--font-mono, monospace)" }}
            >
              {inst ? fmtPrice(active.v, inst.decimals) : active.v.toFixed(2)}
            </text>
          </g>
        )}

        <title>
          {symbol} · {inst ? fmtPrice(last, inst.decimals) : last.toFixed(2)} ·{" "}
          {up ? "+" : ""}
          {change.toFixed(2)}%
        </title>
      </svg>

      {/* Bid / Ask strip */}
      {quote && inst && (
        <div className="mt-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>
            Bid <span className="num text-foreground">{fmtPrice(quote.bid, inst.decimals)}</span>
          </span>
          <span className="num">
            Spread {fmtPrice(quote.ask - quote.bid, inst.decimals)}
          </span>
          <span>
            Ask <span className="num text-foreground">{fmtPrice(quote.ask, inst.decimals)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
