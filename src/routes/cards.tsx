import { createFileRoute } from "@tanstack/react-router";
import { Check, Wifi } from "lucide-react";
import { useState } from "react";
import { Panel, Tilt } from "@/components/glass";
import { cn } from "@/lib/utils";

const CARDS = [
  {
    id: "platinum",
    name: "Platinum card",
    price: "$150 / year",
    last4: "6050",
    face: "linear-gradient(135deg, oklch(0.97 0.01 90), oklch(0.85 0.02 250), oklch(0.93 0.02 95))",
  },
  {
    id: "rose",
    name: "Rose gold card",
    price: "$120 / year",
    last4: "4417",
    face: "linear-gradient(135deg, oklch(0.95 0.02 60), oklch(0.82 0.07 40), oklch(0.92 0.03 80))",
  },
  {
    id: "obsidian",
    name: "Obsidian card",
    price: "$400 / year",
    last4: "9902",
    face: "linear-gradient(135deg, oklch(0.42 0.01 270), oklch(0.24 0.012 268), oklch(0.5 0.02 250))",
  },
];

export const Route = createFileRoute("/cards")({
  head: () => ({
    meta: [
      { title: "Cards — Aurum Metal Card Suite" },
      {
        name: "description",
        content:
          "Choose and manage recycled-metal Aurum cards: instant virtual issuance, spending controls and crypto cashback.",
      },
      { property: "og:title", content: "Cards — Aurum Metal Card Suite" },
      {
        property: "og:description",
        content: "Recycled-metal cards with instant issuance, spend controls and crypto cashback.",
      },
    ],
  }),
  component: Cards,
});

function Cards() {
  const [active, setActive] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = CARDS[active] ?? CARDS[0];

  return (
    <div className="space-y-6 animate-rise">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Choose a card</p>
        <h1 className="mt-1 text-3xl">{card.name}</h1>
        <p className="num mt-1 text-muted-foreground">{card.price}</p>
      </header>

      <div className="relative mx-auto flex h-[280px] max-w-md items-center justify-center sm:h-[320px]">
        {CARDS.map((c, i) => {
          const offset = i - active;
          const isActive = offset === 0;
          return (
            <button
              key={c.id}
              type="button"
              aria-label={`Select ${c.name}`}
              onClick={() => (isActive ? setFlipped((f) => !f) : (setActive(i), setFlipped(false)))}
              className="absolute inset-x-6 top-1/2 -translate-y-1/2 transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
              style={{
                transform: `translateY(-50%) translateX(${offset * 46}px) scale(${isActive ? 1 : 0.86}) rotateY(${offset * -14}deg)`,
                zIndex: 10 - Math.abs(offset),
                opacity: Math.abs(offset) > 1 ? 0.35 : 1,
                perspective: 1200,
              }}
            >
              <Tilt max={isActive ? 12 : 0}>
                <div
                  className="relative aspect-[1.586/1] w-full rounded-3xl p-5 text-left transition-transform duration-700"
                  style={{
                    background: c.face,
                    boxShadow: "var(--shadow-glass)",
                    transform: isActive && flipped ? "rotateY(180deg)" : undefined,
                    transformStyle: "preserve-3d",
                    color: c.id === "obsidian" ? "oklch(0.95 0.01 90)" : "oklch(0.28 0.02 70)",
                  }}
                >
                  <div style={{ backfaceVisibility: "hidden" }}>
                    <div className="flex items-start justify-between text-xs tracking-widest">
                      <span>CREDIT CARD</span>
                      <span>G Pay</span>
                    </div>
                    <Wifi className="absolute right-5 top-1/2 size-5 -rotate-90 opacity-70" aria-hidden />
                    <div
                      className="mt-8 h-8 w-11 rounded-md"
                      style={{ background: "var(--gradient-metal)" }}
                      aria-hidden
                    />
                    <div className="absolute inset-x-5 bottom-5 flex items-end justify-between">
                      <span className="num text-sm tracking-[0.2em]">•••• {c.last4}</span>
                      <span className="font-display text-xl italic">VISA</span>
                    </div>
                  </div>
                </div>
              </Tilt>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center gap-2">
        {CARDS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            aria-label={`Show ${c.name}`}
            onClick={() => setActive(i)}
            className={cn(
              "size-2.5 rounded-full transition-all",
              i === active ? "w-6 bg-primary" : "bg-muted-foreground/40",
            )}
          />
        ))}
      </div>

      <p className="mx-auto max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
        Tap the card to flip it. Our cards are made of recycled metals — colour changes ship
        instantly to your virtual card.
      </p>

      <div className="mx-auto flex max-w-md items-center justify-center gap-3">
        <button
          type="button"
          className="press glass grid size-12 place-items-center rounded-full"
          aria-label="Reset card"
          onClick={() => {
            setActive(0);
            setFlipped(false);
          }}
        >
          ↺
        </button>
        <button
          type="button"
          className="press min-h-12 flex-1 rounded-full bg-primary px-6 text-sm text-primary-foreground"
        >
          Choose {card.name.split(" ")[0]}
        </button>
        <span className="glass grid size-12 place-items-center rounded-full" aria-hidden>
          <Check className="size-4" />
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Spending controls", "Per-merchant, geo and velocity rules, live."],
          ["Crypto cashback", "Up to 3% back, settled in the asset you choose."],
          ["Travel cover", "Insurance and 24/7 concierge included."],
        ].map(([t, d]) => (
          <Panel key={t} className="p-5">
            <h2 className="text-lg">{t}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
