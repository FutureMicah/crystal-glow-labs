import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LiveChart } from "@/components/LiveChart";
import { Panel } from "@/components/glass";
import { openPosition, useEquity, type Side } from "@/lib/account";
import { dayChangePct, fmtPrice, getInstrument, useQuote } from "@/lib/trading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trade/$symbol")({
  head: ({ params }) => ({
    meta: [
      { title: `Trade ${params.symbol.toUpperCase()} — Aurum` },
      {
        name: "description",
        content: `Live order ticket for ${params.symbol.toUpperCase()} with real-time quotes, leverage and margin estimates.`,
      },
      { property: "og:title", content: `Trade ${params.symbol.toUpperCase()} — Aurum` },
      {
        property: "og:description",
        content: "Real-time order ticket with bid/ask execution and margin preview.",
      },
    ],
  }),
  component: Trade,
});

const LEVERAGES = [1, 5, 10, 25, 50];

function Trade() {
  const { symbol } = Route.useParams();
  const navigate = useNavigate();
  const inst = getInstrument(symbol.toUpperCase());
  const quote = useQuote(symbol.toUpperCase());
  const { cash } = useEquity();

  const [side, setSide] = useState<Side>("buy");
  const [qtyRaw, setQtyRaw] = useState("1");
  const [leverage, setLeverage] = useState(5);

  if (!inst) {
    return (
      <div className="space-y-4 animate-rise">
        <h1 className="text-2xl">Unknown instrument</h1>
        <p className="text-sm text-muted-foreground">
          <span className="num">{symbol.toUpperCase()}</span> is not on the Aurum tape.
        </p>
        <Link to="/markets" className="glass press inline-flex rounded-xl px-4 py-2 text-sm">
          Browse markets
        </Link>
      </div>
    );
  }

  const qty = Number(qtyRaw);
  const fill = quote ? (side === "buy" ? quote.ask : quote.bid) : inst.basePrice;
  const notional = fill * (qty > 0 ? qty : 0);
  const margin = notional / leverage;
  const chg = quote ? dayChangePct(quote) : 0;

  const submit = () => {
    const res = openPosition({ symbol: inst.symbol, side, qty, leverage });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(
      `${side === "buy" ? "Bought" : "Sold"} ${qty} ${inst.symbol} @ ${fmtPrice(fill, inst.decimals)}`,
    );
    void navigate({ to: "/positions" });
  };

  return (
    <div className="space-y-5 animate-rise">
      <header className="flex items-center gap-3">
        <Link to="/markets" aria-label="Back to markets" className="glass press rounded-full p-2">
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {inst.cls} · {inst.symbol} · Paper
          </p>
          <h1 className="text-2xl sm:text-3xl">{inst.name}</h1>
        </div>
        {quote && (
          <div className="ml-auto text-right">
            <p className="num text-xl">{fmtPrice(quote.price, inst.decimals)}</p>
            <p className={cn("text-xs", chg >= 0 ? "text-success" : "text-destructive")}>
              {chg >= 0 ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%
            </p>
          </div>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel iridescent className="cinematic-stagger overflow-hidden p-4 sm:p-6 [--stagger:0]">
          <LiveChart symbol={inst.symbol} height={280} />
        </Panel>

        <Panel className="cinematic-stagger space-y-5 p-5 sm:p-6 [--stagger:1]">
          <div className="grid grid-cols-2 gap-2">
            {(["buy", "sell"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={cn(
                  "press rounded-xl py-3 text-sm font-semibold uppercase tracking-widest transition-colors",
                  side === s
                    ? s === "buy"
                      ? "bg-success text-success-foreground"
                      : "bg-destructive text-destructive-foreground"
                    : "glass text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="qty" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Quantity
            </label>
            <input
              id="qty"
              type="number"
              min="0"
              step="any"
              value={qtyRaw}
              onChange={(e) => setQtyRaw(e.target.value)}
              className="glass num mt-2 w-full rounded-xl px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Leverage</p>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {LEVERAGES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLeverage(l)}
                  className={cn(
                    "press num rounded-lg py-2 text-sm transition-colors",
                    leverage === l
                      ? "bg-primary text-primary-foreground"
                      : "glass text-muted-foreground hover:text-foreground",
                  )}
                >
                  {l}×
                </button>
              ))}
            </div>
          </div>

          <dl className="space-y-2 border-t border-border/50 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Est. fill ({side === "buy" ? "ask" : "bid"})</dt>
              <dd className="num">{fmtPrice(fill, inst.decimals)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Notional</dt>
              <dd className="num">${fmtPrice(notional)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Margin required</dt>
              <dd className="num">${fmtPrice(margin)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Free cash</dt>
              <dd className={cn("num", margin > cash && "text-destructive")}>
                ${fmtPrice(cash)}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={submit}
            disabled={!(qty > 0)}
            className={cn(
              "press w-full rounded-xl py-3.5 text-sm font-semibold uppercase tracking-widest transition-colors disabled:opacity-40",
              side === "buy"
                ? "bg-success text-success-foreground"
                : "bg-destructive text-destructive-foreground",
            )}
          >
            {side === "buy" ? "Buy" : "Sell"} {inst.symbol}
          </button>
        </Panel>
      </div>
    </div>
  );
}
