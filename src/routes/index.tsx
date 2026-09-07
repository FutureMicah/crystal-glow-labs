import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Layers, Repeat2, Sprout } from "lucide-react";
import { useEffect, useState } from "react";
import { Chart } from "@/components/Chart";
import { Counter } from "@/components/Counter";
import { Panel, Tilt } from "@/components/glass";
import { ASSETS, fmtUsd, series, totalBalance } from "@/lib/market";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aurum — Frosted Crystal Crypto Portfolio" },
      {
        name: "description",
        content:
          "Track balances, assets and performance in a luxurious frosted-glass crypto wallet with live charts and 3D-feel interactions.",
      },
      { property: "og:title", content: "Aurum — Frosted Crystal Crypto Portfolio" },
      {
        property: "og:description",
        content: "A luxurious glassmorphic crypto portfolio with live charts and kinetic balances.",
      },
    ],
  }),
  component: Portfolio,
});

const QUICK = [
  { label: "Send", icon: ArrowUpRight },
  { label: "Receive", icon: ArrowDownLeft },
  { label: "Swap", icon: Repeat2, to: "/swap" as const },
  { label: "Stake", icon: Sprout },
  { label: "Bridge", icon: Layers },
];

function Portfolio() {
  const base = totalBalance();
  const [balance, setBalance] = useState(base);

  // Live market tick — gentle, deterministic-free drift after hydration.
  useEffect(() => {
    const t = setInterval(() => {
      setBalance((b) => b * (1 + (Math.random() - 0.48) * 0.0009));
    }, 3200);
    return () => clearInterval(t);
  }, []);

  const change = ((balance - base) / base) * 100 + 1.86;

  return (
    <div className="space-y-5 animate-rise">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Good morning</p>
          <h1 className="text-2xl sm:text-3xl">Portfolio</h1>
        </div>
        <span className="font-display text-xl tracking-[0.3em] text-metal lg:hidden">AURUM</span>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel iridescent className="animate-breathe cinematic-stagger overflow-hidden p-6 sm:p-8 [--stagger:0]">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Total balance</p>
          <Counter
            value={balance}
            format={(n) => fmtUsd(n)}
            className="num mt-2 block text-[clamp(2.4rem,8vw,4.5rem)] leading-none"
          />
          <p className="mt-3 flex items-center gap-2 text-sm">
            <span className={cn(change >= 0 ? "text-success" : "text-destructive")}>
              {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
            </span>
            <span className="text-muted-foreground">today · all chains</span>
          </p>
          <div className="-mx-2 mt-4">
            <Chart data={series("portfolio", 80, 0.35)} height={200} />
          </div>

          <div className="mt-5 grid grid-cols-5 gap-2">
            {QUICK.map(({ label, icon: Icon, to }) => {
              const inner = (
                <>
                  <Icon className="size-4" aria-hidden />
                  <span className="text-[11px] sm:text-xs">{label}</span>
                </>
              );
              const cls =
                "press glass flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl";
              return to ? (
                <Link key={label} to={to} className={cls}>
                  {inner}
                </Link>
              ) : (
                <button key={label} type="button" className={cls}>
                  {inner}
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel className="cinematic-stagger p-6 [--stagger:1]">
            <h2 className="text-lg">Portfolio health</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Diversified across 4 chains. Volatility exposure is moderate.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div
                className="grid size-20 shrink-0 place-items-center rounded-full animate-spin-slow"
                style={{
                  background: "conic-gradient(var(--rosegold) 0 78%, var(--muted) 78% 100%)",
                }}
              >
                <span className="grid size-16 place-items-center rounded-full bg-card num text-xl">
                  78
                </span>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Risk score · Balanced</li>
                <li>Yield running · 4 positions</li>
                <li>Insurance · Active</li>
              </ul>
            </div>
          </Panel>

          <Panel className="cinematic-stagger p-6 [--stagger:2]">
            <h2 className="text-lg">Allocation</h2>
            <div className="mt-4 space-y-3">
              {ASSETS.map((a) => {
                const value = a.price * a.holdings;
                const pct = (value / base) * 100;
                return (
                  <div key={a.id}>
                    <div className="flex justify-between text-sm">
                      <span>{a.symbol}</span>
                      <span className="num text-muted-foreground">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-[width] duration-1000"
                        style={{ width: `${pct}%`, background: a.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg">Assets</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ASSETS.map((a, index) => (
            <Tilt key={a.id} max={7} className="cinematic-stagger" style={{ "--stagger": index + 3 } as React.CSSProperties}>
              <Link
                to="/assets/$assetId"
                params={{ assetId: a.id }}
                className="glass press block rounded-2xl p-5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-11 place-items-center rounded-full text-lg"
                    style={{
                      background: `radial-gradient(circle at 30% 25%, white, ${a.color})`,
                      color: "oklch(0.25 0.02 70)",
                    }}
                    aria-hidden
                  >
                    {a.glyph}
                  </span>
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.holdings} {a.symbol}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="num text-lg">{fmtUsd(a.price * a.holdings)}</p>
                    <p
                      className={cn(
                        "text-xs",
                        a.change24h >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {a.change24h >= 0 ? "+" : ""}
                      {a.change24h}%
                    </p>
                  </div>
                </div>
                <div className="-mx-2 mt-3">
                  <Chart
                    data={series(a.symbol, 40, a.change24h / 12)}
                    height={64}
                    interactive={false}
                    stroke={a.color}
                  />
                </div>
              </Link>
            </Tilt>
          ))}
        </div>
      </section>
    </div>
  );
}
