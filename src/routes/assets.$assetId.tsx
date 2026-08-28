import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Chart } from "@/components/Chart";
import { Counter } from "@/components/Counter";
import { Panel, Tilt } from "@/components/glass";
import { getAsset, fmtUsd, series } from "@/lib/market";
import { cn } from "@/lib/utils";

const RANGES = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y"] as const;

export const Route = createFileRoute("/assets/$assetId")({
  loader: ({ params }) => {
    const asset = getAsset(params.assetId);
    if (!asset) throw notFound();
    return asset;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} (${loaderData.symbol}) — Aurum` : "Asset — Aurum";
    const description = loaderData
      ? `Live ${loaderData.name} price, holdings, on-chain analytics and one-tap trading inside Aurum.`
      : "Live asset analytics inside Aurum.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: AssetDetail,
});

function AssetDetail() {
  const asset = Route.useLoaderData();
  const [range, setRange] = useState<(typeof RANGES)[number]>("1D");
  const value = asset.price * asset.holdings;

  return (
    <div className="space-y-5 animate-rise">
      <Link
        to="/"
        className="press glass inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> Portfolio
      </Link>

      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Panel iridescent className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <Tilt max={14} className="mb-4">
              <span
                className="grid size-20 place-items-center rounded-full text-3xl animate-float"
                style={{
                  background: `radial-gradient(circle at 30% 25%, white, ${asset.color})`,
                  color: "oklch(0.25 0.02 70)",
                  boxShadow: "var(--shadow-glass)",
                }}
                aria-hidden
              >
                {asset.glyph}
              </span>
            </Tilt>
            <h1 className="text-3xl">{asset.name}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {asset.holdings} {asset.symbol} available ·{" "}
              <span className={asset.change24h >= 0 ? "text-success" : "text-destructive"}>
                {asset.change24h >= 0 ? "▲" : "▼"} {Math.abs(asset.change24h)}%
              </span>
            </p>
          </div>

          <Counter
            value={value}
            format={(n) => fmtUsd(n)}
            className="num mt-6 block text-[clamp(2rem,6vw,3.5rem)] leading-none"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            {fmtUsd(asset.price)} per {asset.symbol} · spot
          </p>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "press min-h-9 rounded-full px-3.5 text-xs transition-colors",
                  r === range ? "bg-primary text-primary-foreground" : "glass text-muted-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="-mx-2 mt-4">
            <Chart
              key={range}
              data={series(asset.symbol + range, 90, asset.change24h / 14)}
              height={240}
              stroke={asset.color}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["Buy", "Sell", "Stake", "Lend"].map((label, i) => (
              <button
                key={label}
                type="button"
                className={cn(
                  "press min-h-12 rounded-full text-sm",
                  i === 0 ? "bg-primary text-primary-foreground" : "glass",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Est. gas 0.0004 ETH · MEV protection on
          </p>
        </Panel>

        <div className="space-y-5">
          <Panel className="p-6">
            <h2 className="text-lg">Order book depth</h2>
            <div className="mt-4 space-y-1.5">
              {series(asset.symbol + "book", 8).map((v, i) => {
                const bid = i % 2 === 0;
                const w = 30 + (Math.abs(v) % 65);
                return (
                  <div key={i} className="relative h-6 overflow-hidden rounded-md bg-muted/40">
                    <div
                      className="absolute inset-y-0 left-0 rounded-md opacity-40"
                      style={{
                        width: `${w}%`,
                        background: bid ? "var(--success)" : "var(--destructive)",
                      }}
                    />
                    <div className="relative flex h-full items-center justify-between px-2 text-[11px]">
                      <span className="num">{fmtUsd(asset.price * (1 + (i - 4) / 400), 2)}</span>
                      <span className="num text-muted-foreground">{(w * 3.4).toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel className="p-6">
            <h2 className="text-lg">Signals</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["Social sentiment", "Bullish · 71%"],
                ["On-chain flows", "Net inflow 4.2K"],
                ["AI pattern", "Ascending triangle"],
                ["Volatility", "Moderate"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
