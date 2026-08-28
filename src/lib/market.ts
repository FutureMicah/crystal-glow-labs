export type Asset = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  holdings: number;
  color: string;
  glyph: string;
};

export const ASSETS: Asset[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    price: 68420.55,
    change24h: 2.41,
    holdings: 0.842,
    color: "oklch(0.78 0.15 65)",
    glyph: "₿",
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    price: 3512.18,
    change24h: -1.12,
    holdings: 6.4,
    color: "oklch(0.7 0.09 275)",
    glyph: "Ξ",
  },
  {
    id: "bnb",
    symbol: "BNB",
    name: "BNB Chain",
    price: 601.35,
    change24h: 0.86,
    holdings: 64.57,
    color: "oklch(0.85 0.14 95)",
    glyph: "⬡",
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    price: 172.9,
    change24h: 5.32,
    holdings: 120.5,
    color: "oklch(0.75 0.13 320)",
    glyph: "◎",
  },
  {
    id: "tether",
    symbol: "USDT",
    name: "Tether",
    price: 1.0,
    change24h: 0.01,
    holdings: 18752.4,
    color: "oklch(0.72 0.11 165)",
    glyph: "₮",
  },
];

export const getAsset = (id: string) => ASSETS.find((a) => a.id === id);

export const totalBalance = () =>
  ASSETS.reduce((sum, a) => sum + a.price * a.holdings, 0);

/** Deterministic pseudo-random walk so SSR and client render identically. */
export function series(seed: string, points = 60, drift = 0): number[] {
  let h = 2166136261;
  for (const ch of seed) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  const out: number[] = [];
  let v = 100;
  for (let i = 0; i < points; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    const r = ((h >>> 8) % 1000) / 1000 - 0.5;
    v = v + r * 6 + drift;
    out.push(v);
  }
  return out;
}

export const fmtUsd = (n: number, digits = 2) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
