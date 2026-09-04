import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownUp } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Panel } from "@/components/glass";
import { ASSETS, fmtUsd } from "@/lib/market";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/swap")({
  head: () => ({
    meta: [
      { title: "Swap — Aurum Best-Route Exchange" },
      {
        name: "description",
        content:
          "Swap coins with best-route aggregation, live price impact and slippage protection in Aurum's frosted-glass trade engine.",
      },
      { property: "og:title", content: "Swap — Aurum Best-Route Exchange" },
      {
        property: "og:description",
        content: "Best-route swaps with live price impact and slippage protection.",
      },
    ],
  }),
  component: Swap,
});

function Swap() {
  const [fromId, setFromId] = useState("bnb");
  const [toId, setToId] = useState("tether");
  const [amount, setAmount] = useState("0.05");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const dragging = useRef(false);
  const track = useRef<HTMLDivElement>(null);

  const from = ASSETS.find((a) => a.id === fromId)!;
  const to = ASSETS.find((a) => a.id === toId)!;
  const amt = Number(amount) || 0;
  const received = useMemo(() => (amt * from.price) / to.price, [amt, from, to]);

  const flip = () => {
    setFromId(toId);
    setToId(fromId);
    setDone(false);
    setProgress(0);
  };

  const onDrag = (clientX: number) => {
    const el = track.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - r.left - 26) / (r.width - 52)));
    setProgress(p);
    if (p > 0.97) {
      dragging.current = false;
      setDone(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(18);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-5 animate-rise lg:max-w-2xl">
      <header className="text-center">
        <p className="font-display text-xl tracking-[0.35em] text-metal">AURUM</p>
        <h1 className="mt-2 text-3xl">Swap Coins</h1>
      </header>

      <div className="relative">
        <Panel iridescent className="p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>You Pay</span>
            <span className="num">
              Balance: {from.holdings} {from.symbol}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <TokenPicker value={fromId} onChange={setFromId} exclude={toId} />
            <input
              inputMode="decimal"
              aria-label="Amount to pay"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^0-9.]/g, ""));
                setDone(false);
                setProgress(0);
              }}
              className="num w-full bg-transparent text-right text-3xl outline-none"
            />
          </div>
          <p className="num mt-1 text-right text-xs text-muted-foreground">
            ≈ {fmtUsd(amt * from.price)}
          </p>
        </Panel>

        <button
          type="button"
          onClick={flip}
          aria-label="Flip swap direction"
          className="press glass-strong absolute left-1/2 top-1/2 z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-transform hover:rotate-180"
        >
          <ArrowDownUp className="size-4" aria-hidden />
        </button>

        <Panel className="mt-3 p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>You Receive</span>
            <span className="num">
              Balance: {to.holdings} {to.symbol}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <TokenPicker value={toId} onChange={setToId} exclude={fromId} />
            <span className="num w-full text-right text-3xl">
              {received.toLocaleString("en-US", { maximumFractionDigits: 4 })}
            </span>
          </div>
          <p className="num mt-1 text-right text-xs text-muted-foreground">
            ≈ {fmtUsd(received * to.price)}
          </p>
        </Panel>
      </div>

      <div className="space-y-1 text-center text-xs text-muted-foreground">
        <p className="num">Fee: 0.30 {to.symbol} · price impact 0.04%</p>
        <p className="num">
          1 {from.symbol} ≈ {(from.price / to.price).toLocaleString("en-US", { maximumFractionDigits: 4 })}{" "}
          {to.symbol}
        </p>
      </div>

      <div
        ref={track}
        className={cn(
          "glass-strong iridescent-edge relative flex h-16 select-none items-center overflow-hidden rounded-full px-2",
          done && "bg-primary",
        )}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => dragging.current && onDrag(e.clientX)}
        onPointerUp={() => {
          dragging.current = false;
          if (!done) setProgress(0);
        }}
        onPointerLeave={() => {
          dragging.current = false;
          if (!done) setProgress(0);
        }}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200"
          style={{
            width: `${progress * 100}%`,
            background: "color-mix(in oklab, var(--rosegold) 35%, transparent)",
          }}
          aria-hidden
        />
        <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm">
          {done ? "Swap complete ✦" : "Slide to Swap"}
        </span>
        <span
          role="slider"
          tabIndex={0}
          aria-label="Slide to swap"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setProgress(1);
              setDone(true);
            }
          }}
          className="relative grid size-12 cursor-grab place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:cursor-grabbing"
          style={{ transform: `translateX(calc(${progress} * (100cqw)))` }}
        >
          →
        </span>
      </div>

      {done && (
        <p className="animate-rise text-center text-sm text-success">
          Received {received.toLocaleString("en-US", { maximumFractionDigits: 4 })} {to.symbol} —
          settled via best route across 3 pools.
        </p>
      )}
    </div>
  );
}

function TokenPicker({
  value,
  onChange,
  exclude,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude: string;
}) {
  const asset = ASSETS.find((a) => a.id === value)!;
  return (
    <label className="press glass flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3">
      <span
        className="grid size-8 place-items-center rounded-full text-sm"
        style={{
          background: `radial-gradient(circle at 30% 25%, white, ${asset.color})`,
          color: "oklch(0.25 0.02 70)",
        }}
        aria-hidden
      >
        {asset.glyph}
      </span>
      <select
        aria-label="Select token"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm outline-none"
      >
        {ASSETS.filter((a) => a.id !== exclude).map((a) => (
          <option key={a.id} value={a.id}>
            {a.symbol}
          </option>
        ))}
      </select>
    </label>
  );
}
