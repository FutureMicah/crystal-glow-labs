import { useEffect, useSyncExternalStore } from "react";
import { getInstrument, getQuotes } from "./trading";

// ── Account / position store (demo account, persisted locally) ─────
export type Side = "buy" | "sell";

export type Position = {
  id: string;
  symbol: string;
  side: Side;
  qty: number;
  entryPrice: number;
  leverage: number;
  margin: number;
  openedAt: number;
};

export type ClosedTrade = Position & {
  exitPrice: number;
  pnl: number;
  closedAt: number;
};

type AccountState = {
  cash: number;
  positions: Position[];
  history: ClosedTrade[];
};

const STARTING_CASH = 100_000;
const STORAGE_KEY = "aurum-demo-account-v1";

const freshState = (): AccountState => ({
  cash: STARTING_CASH,
  positions: [],
  history: [],
});

let state: AccountState = freshState();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  state = { ...state };
  persist();
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AccountState;
      if (typeof parsed.cash === "number" && Array.isArray(parsed.positions)) {
        state = {
          cash: parsed.cash,
          positions: parsed.positions,
          history: Array.isArray(parsed.history) ? parsed.history : [],
        };
        for (const l of listeners) l();
      }
    }
  } catch {
    /* corrupted cache — start fresh */
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => state;

export function useAccount(): AccountState {
  useEffect(hydrate, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ── Derived values ──────────────────────────────────────────────────
export function positionPnl(p: Position): number {
  const q = getQuotes().quotes[p.symbol];
  const mark = q?.price ?? p.entryPrice;
  const dir = p.side === "buy" ? 1 : -1;
  return (mark - p.entryPrice) * p.qty * dir;
}

export function useEquity() {
  const account = useAccount();
  // subscribe to the tape so equity/P&L re-render on every tick
  const tape = getQuotesFromHook();
  const unrealized = account.positions.reduce((sum, p) => {
    const mark = tape.quotes[p.symbol]?.price ?? p.entryPrice;
    const dir = p.side === "buy" ? 1 : -1;
    return sum + (mark - p.entryPrice) * p.qty * dir;
  }, 0);
  return { ...account, unrealized, equity: account.cash + unrealized };
}

// Late import to avoid a cycle at module scope.
import { useQuotes as getQuotesFromHook } from "./trading";

// ── Actions ─────────────────────────────────────────────────────────
export function openPosition(input: {
  symbol: string;
  side: Side;
  qty: number;
  leverage: number;
}): { ok: true } | { ok: false; error: string } {
  const inst = getInstrument(input.symbol);
  const q = getQuotes().quotes[input.symbol];
  if (!inst || !q) return { ok: false, error: "Unknown instrument" };
  if (!(input.qty > 0)) return { ok: false, error: "Enter a quantity above zero" };

  const fill = input.side === "buy" ? q.ask : q.bid;
  const notional = fill * input.qty;
  const margin = notional / input.leverage;
  if (margin > state.cash) {
    return { ok: false, error: "Insufficient free margin for this size" };
  }

  const pos: Position = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    symbol: input.symbol,
    side: input.side,
    qty: input.qty,
    entryPrice: fill,
    leverage: input.leverage,
    margin,
    openedAt: Date.now(),
  };
  state = {
    ...state,
    cash: state.cash - margin,
    positions: [...state.positions, pos],
  };
  emit();
  return { ok: true };
}

export function closePosition(id: string): { ok: boolean; pnl: number } {
  const pos = state.positions.find((p) => p.id === id);
  if (!pos) return { ok: false, pnl: 0 };
  const inst = getInstrument(pos.symbol);
  const q = getQuotes().quotes[pos.symbol];
  const exit = pos.side === "buy" ? (q?.bid ?? pos.entryPrice) : (q?.ask ?? pos.entryPrice);
  const dir = pos.side === "buy" ? 1 : -1;
  const pnl = (exit - pos.entryPrice) * pos.qty * dir;

  const closed: ClosedTrade = {
    ...pos,
    exitPrice: inst ? exit : exit,
    pnl,
    closedAt: Date.now(),
  };
  state = {
    cash: state.cash + pos.margin + pnl,
    positions: state.positions.filter((p) => p.id !== id),
    history: [closed, ...state.history].slice(0, 100),
  };
  emit();
  return { ok: true, pnl };
}

export function resetAccount() {
  state = freshState();
  emit();
}
