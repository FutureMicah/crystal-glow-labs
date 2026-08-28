import { useId, useMemo, useState } from "react";

export function Chart({
  data,
  height = 180,
  stroke = "var(--foreground)",
  interactive = true,
}: {
  data: number[];
  height?: number;
  stroke?: string;
  interactive?: boolean;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 600;
  const H = height;

  const { path, area, pts, min, max } = useMemo(() => {
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

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full touch-none"
      style={{ height }}
      preserveAspectRatio="none"
      role="img"
      aria-label="Price history chart"
      onPointerMove={
        interactive
          ? (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const i = Math.round(((e.clientX - r.left) / r.width) * (pts.length - 1));
              setHover(Math.max(0, Math.min(pts.length - 1, i)));
            }
          : undefined
      }
      onPointerLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id={`f-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--rosegold)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--rosegold)" stopOpacity="0" />
        </linearGradient>
        <filter id={`g-${id}`}>
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={area} fill={`url(#f-${id})`} opacity={0.9} />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        filter={`url(#g-${id})`}
        style={{
          strokeDasharray: 4000,
          strokeDashoffset: 4000,
          animation: "draw 1.8s cubic-bezier(0.22,1,0.36,1) forwards",
        }}
      />
      {active && (
        <g>
          <line x1={active.x} y1={0} x2={active.x} y2={H} stroke="var(--border)" strokeWidth={1} />
          <circle cx={active.x} cy={active.y} r={4} fill="var(--rosegold)" />
        </g>
      )}
      <title>{`Range ${min.toFixed(2)} – ${max.toFixed(2)}`}</title>
    </svg>
  );
}
