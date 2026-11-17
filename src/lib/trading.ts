import { useEffect, useSyncExternalStore } from "react";

// ── Instrument catalog ──────────────────────────────────────────────
export type AssetClass = "Crypto" | "Forex" | "Metals" | "Indices" | "Energy";

export type Instrument = {
  symbol: string;
  name: string;
  cls: AssetClass;
  basePrice: number;
  decimals: number;
  /** spread in basis points applied half/half on buy/sell */
  spreadBps: number;
  /** per-tick volatility multiplier */
  vol: number;
  glyph: string;
};

export const INSTRUMENTS: Instrument[] = [
  { symbol: "BTCUSD", name: "Bitcoin", cls: "Crypto", basePrice: 68420.55, decimals: 2, spreadBps: 6, vol: 1.6, glyph: "₿" },
  { symbol: "ETHUSD", name: "Ethereum", cls: "Crypto", basePrice: 3512.18, decimals: 2, spreadBps: 8, vol: 1.9, glyph: "Ξ" },
  { symbol: "SOLUSD", name: "Solana", cls: "Crypto", basePrice: 172.9, decimals: 2, spreadBps: 10, vol: 2.4, glyph: "◎" },
  { symbol: "BNBUSD", name: "BNB Chain", cls: "Crypto", basePrice: 601.35, decimals: 2, spreadBps: 10, vol: 1.7, glyph: "⬡" },
  { symbol: "EURUSD", name: "Euro / US Dollar", cls: "Forex", basePrice: 1.0842, decimals: 5, spreadBps: 1.2, vol: 0.06, glyph: "€" },
  { symbol: "GBPUSD", name: "Pound / US Dollar", cls: "Forex", basePrice: 1.2718, decimals: 5, spreadBps: 1.5, vol: 0.07, glyph: "£" },
  { symbol: "USDJPY", name: "US Dollar / Yen", cls: "Forex", basePrice: 156.42, decimals: 3, spreadBps: 1.4, vol: 0.07, glyph: "¥" },
  { symbol: "XAUUSD", name: "Gold Spot", cls: "Metals", basePrice: 2384.6, decimals: 2, spreadBps: 3, vol: 0.35, glyph: "Au" },
  { symbol: "XAGUSD", name: "Silver Spot", cls: "Metals", basePrice: 28.42, decimals: 3, spreadBps: 4, vol: 0.5, glyph: "Ag" },
  { symbol: "US500", name: "S&P 500 Index", cls: "Indices", basePrice: 5487.2, decimals: 1, spreadBps: 2, vol: 0.22, glyph: "SPX" },
  { symbol: "NAS100", name: "Nasdaq 100 Index", cls: "Indices", basePrice: 19724.5, decimals: 1, spreadBps: 2.5, vol: 0.3, glyph: "NDX" },
  { symbol: "USOIL", name: "WTI Crude Oil", cls: "Energy", basePrice: 78.64, decimals: 2, spreadBps: 5, vol: 0.8, glyph: "WTI" },
];

export const getInstrument = (symbol: string) =>
  INSTRUMENTS.find((i) => i.symbol === symbol);

export const ASSET_CLASSES: AssetClass[] = ["Crypto", "Forex", "Metals", "Indices", "Energy"];

// ── Live quote engine + rolling history ─────────────────────────────
export type Quote = {
  price: number;
  prev: number;
  dayOpen: number;
  bid: number;
  ask: number;
};

const HISTORY_LEN = 120;

type TapeState = {
  quotes: Record<string, Quote>;
  history: Record<string, number[]>;
  tick: number;
};

function seedState(): TapeState {
  const quotes: Record<string, Quote> = {};
  const history: Record<string, number[]> = {};
  for (const inst of INSTRUMENTS) {
    const half = (inst.basePrice * inst.spreadBps) / 20000;
    quotes[inst.symbol] = {
      price: inst.basePrice,
      prev: inst.basePrice,
      dayOpen: inst.basePrice,
      bid: inst.basePrice - half,
      ask: inst.basePrice + half,
    };
    // Seed a short history so charts aren't empty on first render
    const hist: number[] = [];
    let v = inst.basePrice;
    for (let i = 0; i < 40; i++) {
      const r = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      v = Math.max(inst.basePrice * 0.5, v + inst.basePrice * 0.0004 * inst.vol * r);
      hist.push(v);
    }
    history[inst.symbol] = hist;
  }
  return { quotes, history, tick: 0 };
}

let state: TapeState = seedState();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function emit() {
  state = { ...state };
  for (const l of listeners) l();
}

function tickOnce() {
  const nextQuotes: Record<string, Quote> = { ...state.quotes };
  const nextHistory: Record<string, number[]> = { ...state.history };

  for (const inst of INSTRUMENTS) {
    const q = nextQuotes[inst.symbol]!;
    // gaussian-ish step via summed uniforms
    const r = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    const step = inst.basePrice * 0.0006 * inst.vol * r;
    const price = Math.max(inst.basePrice * 0.5, q.price + step);
    const half = (price * inst.spreadBps) / 20000;
    nextQuotes[inst.symbol] = {
      price,
      prev: q.price,
      dayOpen: q.dayOpen,
      bid: price - half,
      ask: price + half,
    };

    // Rolling history for live charts
    const hist = nextHistory[inst.symbol] ?? [];
    const updated = [...hist, price].slice(-HISTORY_LEN);
    nextHistory[inst.symbol] = updated;
  }

  state = {
    quotes: nextQuotes,
    history: nextHistory,
    tick: state.tick + 1,
  };
  for (const l of listeners) l();
}

export function startTape() {
  if (timer || typeof window === "undefined") return;
  timer = setInterval(tickOnce, 800);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => state;

/** Non-hook access to the current tape (for order execution, P&L math). */
export const getQuotes = (): TapeState => state;

/** Live quotes for every instrument. Starts the tape on first client render. */
export function useQuotes(): TapeState {
  useEffect(startTape, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useQuote(symbol: string): Quote | undefined {
  return useQuotes().quotes[symbol];
}

/** Live rolling price history for charts (updates every tick). */
export function usePriceHistory(symbol: string): number[] {
  const { history } = useQuotes();
  return history[symbol] ?? [];
}

export const dayChangePct = (q: Quote) =>
  q.dayOpen === 0 ? 0 : ((q.price - q.dayOpen) / q.dayOpen) * 100;

// ── Formatting ──────────────────────────────────────────────────────
export const fmtPrice = (n: number, decimals = 2) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export const fmtSignedUsd = (n: number) =>
  `${n < 0 ? "−" : "+"}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
