import { createFileRoute, Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import type { CSSProperties } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/glass";
import {
  closePosition,
  positionPnl,
  resetAccount,
  useEquity,
} from "@/lib/account";
import { fmtPrice, fmtSignedUsd, getInstrument, useQuotes } from "@/lib/trading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/positions")({
  head: () => ({
    meta: [
      { title: "Positions — Aurum" },
      {
        name: "description",
        content:
          "Open positions, live unrealized P&L, account equity and trade history on the Aurum demo account.",
      },
      { property: "og:title", content: "Positions — Aurum" },
      {
        property: "og:description",
        content: "Live position management with real-time P&L and equity tracking.",
      },
    ],
  }),
  component: Positions,
});

function Positions() {
  useQuotes(); // re-render on every tick
  const { cash, equity, unrealized, positions, history } = useEquity();

  return (
    <div className="space-y-5 animate-rise">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Demo account</p>
          <h1 className="text-2xl sm:text-3xl">Positions</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            resetAccount();
            toast.success("Demo account reset to $100,000");
          }}
          className="glass press flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Reset
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Equity", value: `$${fmtPrice(equity)}`, tone: "" },
          { label: "Free cash", value: `$${fmtPrice(cash)}`, tone: "" },
          {
            label: "Unrealized P&L",
            value: fmtSignedUsd(unrealized),
            tone: unrealized >= 0 ? "text-success" : "text-destructive",
          },
        ].map((s) => (
          <Panel key={s.label} className="cinematic-stagger p-4" style={{ "--stagger": s.label === "Equity" ? 0 : s.label === "Free cash" ? 1 : 2 } as CSSProperties}>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
            <p className={cn("num mt-1 text-xl", s.tone)}>{s.value}</p>
          </Panel>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg">Open positions</h2>
        {positions.length === 0 ? (
          <Panel className="p-6 text-center text-sm text-muted-foreground">
            No open positions.{" "}
            <Link to="/markets" className="text-foreground underline underline-offset-4">
              Browse markets
            </Link>{" "}
            to place your first trade.
          </Panel>
        ) : (
          <div className="space-y-3">
            {positions.map((p) => {
              const inst = getInstrument(p.symbol);
              const pnl = positionPnl(p);
              const roe = p.margin > 0 ? (pnl / p.margin) * 100 : 0;
              return (
                <Panel key={p.id} className="cinematic-stagger flex flex-wrap items-center gap-x-6 gap-y-3 p-4" style={{ "--stagger": positions.indexOf(p) } as CSSProperties}>
                  <div>
                    <p className="font-medium">
                      <span
                        className={cn(
                          "mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          p.side === "buy"
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive",
                        )}
                      >
                        {p.side}
                      </span>
                      {p.symbol}
                      <span className="ml-2 text-xs text-muted-foreground">{p.leverage}×</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {inst?.name} · qty {p.qty}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground">Entry</p>
                    <p className="num">{fmtPrice(p.entryPrice, inst?.decimals ?? 2)}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground">Margin</p>
                    <p className="num">${fmtPrice(p.margin)}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground">P&L</p>
                    <p className={cn("num", pnl >= 0 ? "text-success" : "text-destructive")}>
                      {fmtSignedUsd(pnl)}{" "}
                      <span className="text-xs">({roe >= 0 ? "+" : ""}{roe.toFixed(1)}%)</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const r = closePosition(p.id);
                      if (r.ok) {
                        toast.success(`Closed ${p.symbol} · ${fmtSignedUsd(r.pnl)}`);
                      }
                    }}
                    className="glass press ml-auto rounded-xl px-4 py-2 text-sm hover:text-foreground"
                  >
                    Close
                  </button>
                </Panel>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg">Trade history</h2>
        {history.length === 0 ? (
          <Panel className="p-6 text-center text-sm text-muted-foreground">
            Closed trades will appear here.
          </Panel>
        ) : (
          <div className="space-y-2">
            {history.map((t) => {
              const inst = getInstrument(t.symbol);
              return (
                <Panel
                  key={t.id}
                  className="cinematic-stagger flex flex-wrap items-center gap-x-5 gap-y-1 p-3.5 text-sm"
                  style={{ "--stagger": history.indexOf(t) } as CSSProperties}
                >
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                      t.side === "buy"
                        ? "bg-success/20 text-success"
                        : "bg-destructive/20 text-destructive",
                    )}
                  >
                    {t.side}
                  </span>
                  <span className="font-medium">{t.symbol}</span>
                  <span className="num text-muted-foreground">
                    {fmtPrice(t.entryPrice, inst?.decimals ?? 2)} →{" "}
                    {fmtPrice(t.exitPrice, inst?.decimals ?? 2)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.closedAt).toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      "num ml-auto",
                      t.pnl >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {fmtSignedUsd(t.pnl)}
                  </span>
                </Panel>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
