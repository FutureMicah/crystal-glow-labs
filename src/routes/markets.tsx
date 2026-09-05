import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Panel } from "@/components/glass";
import {
  ASSET_CLASSES,
  INSTRUMENTS,
  dayChangePct,
  fmtPrice,
  useQuotes,
  type AssetClass,
} from "@/lib/trading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Markets — Aurum" },
      {
        name: "description",
        content:
          "Live watchlist of crypto, forex, metals, indices and energy instruments with real-time bid/ask quotes.",
      },
      { property: "og:title", content: "Markets — Aurum" },
      {
        property: "og:description",
        content: "Real-time multi-asset watchlist with live bid/ask streaming.",
      },
    ],
  }),
  component: Markets,
});

function Markets() {
  const { quotes } = useQuotes();
  const [cls, setCls] = useState<AssetClass | "All">("All");

  const rows = INSTRUMENTS.filter((i) => cls === "All" || i.cls === cls);

  return (
    <div className="space-y-5 animate-rise">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Live feed</p>
        <h1 className="text-2xl sm:text-3xl">Markets</h1>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["All", ...ASSET_CLASSES] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCls(c)}
            className={cn(
              "press shrink-0 rounded-full px-4 py-2 text-sm transition-colors",
              cls === c
                ? "bg-primary text-primary-foreground"
                : "glass text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((inst) => {
          const q = quotes[inst.symbol];
          if (!q) return null;
          const chg = dayChangePct(q);
          const up = q.price >= q.prev;
          return (
            <Link
              key={inst.symbol}
              to="/trade/$symbol"
              params={{ symbol: inst.symbol }}
              className="block"
            >
              <Panel className="press p-4 transition-colors hover:bg-card/80">
                <div className="flex items-center gap-3">
                  <span className="glass grid size-10 shrink-0 place-items-center rounded-full text-sm font-medium">
                    {inst.glyph}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{inst.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {inst.symbol} · {inst.cls}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p
                      className={cn(
                        "num text-base transition-colors duration-300",
                        up ? "text-success" : "text-destructive",
                      )}
                    >
                      {fmtPrice(q.price, inst.decimals)}
                    </p>
                    <p className={cn("text-xs", chg >= 0 ? "text-success" : "text-destructive")}>
                      {chg >= 0 ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  <span>
                    Bid <span className="num text-foreground">{fmtPrice(q.bid, inst.decimals)}</span>
                  </span>
                  <span>
                    Ask <span className="num text-foreground">{fmtPrice(q.ask, inst.decimals)}</span>
                  </span>
                  <span className="text-muted-foreground">{inst.spreadBps} bps</span>
                </div>
              </Panel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
