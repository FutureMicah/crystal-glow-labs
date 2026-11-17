import { useEffect, useSyncExternalStore } from "react";

// ── Packages (seeded from Axion package1) ─────────────────────────────
export type InvestmentPackage = {
  id: number;
  name: string;
  /** Daily ROI percentage (e.g. 1.3 = 1.3%) */
  increase: number;
  bonus: number;
  /** Duration in days */
  duration: number;
  minAmount: number;
  maxAmount: number;
};

export const PACKAGES: InvestmentPackage[] = [
  {
    id: 5,
    name: "Starter Plan",
    increase: 1.3,
    bonus: 0,
    duration: 1,
    minAmount: 100,
    maxAmount: 499,
  },
  {
    id: 6,
    name: "Silver Plan",
    increase: 1.5,
    bonus: 0,
    duration: 2,
    minAmount: 500,
    maxAmount: 999,
  },
  {
    id: 8,
    name: "Advanced Plan",
    increase: 2.9,
    bonus: 0,
    duration: 1,
    minAmount: 1000,
    maxAmount: 4999,
  },
  {
    id: 9,
    name: "Extended Plan",
    increase: 3.3,
    bonus: 0,
    duration: 1,
    minAmount: 5000,
    maxAmount: 1_000_000,
  },
  {
    id: 19,
    name: "24hour Plan",
    increase: 125,
    bonus: 125,
    duration: 1,
    minAmount: 500,
    maxAmount: 1000,
  },
];

export const getPackage = (id: number) => PACKAGES.find((p) => p.id === id);

// ── Active Investment ─────────────────────────────────────────────────
export type InvestmentStatus = "active" | "completed" | "cancelled";

export type Investment = {
  id: string;
  packageId: number;
  packageName: string;
  amount: number; // USD
  increase: number;
  bonus: number;
  durationDays: number;
  startedAt: number; // timestamp ms
  endsAt: number;
  profit: number; // expected total profit
  status: InvestmentStatus;
  coinType?: string;
};

// ── Progress helpers ──────────────────────────────────────────────────
/** Returns 0–100 progress based on real elapsed time */
export function getInvestmentProgress(inv: Investment, now = Date.now()): number {
  if (inv.status === "completed") return 100;
  if (inv.status === "cancelled") return 0;

  const total = inv.endsAt - inv.startedAt;
  if (total <= 0) return 100;

  const elapsed = now - inv.startedAt;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

/** Remaining time in milliseconds */
export function getRemainingMs(inv: Investment, now = Date.now()): number {
  return Math.max(0, inv.endsAt - now);
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "Completed";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  return `${mins}m ${secs}s`;
}

// ── Account / Investment store ────────────────────────────────────────
type InvestmentState = {
  balance: number; // USD available balance
  investments: Investment[];
};

const STORAGE_KEY = "crystal-glow-investments-v1";
const STARTING_BALANCE = 25_000;

const freshState = (): InvestmentState => ({
  balance: STARTING_BALANCE,
  investments: [],
});

let state: InvestmentState = freshState();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  state = { ...state, investments: [...state.investments] };
  persist();
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as InvestmentState;
      if (typeof parsed.balance === "number" && Array.isArray(parsed.investments)) {
        state = {
          balance: parsed.balance,
          investments: parsed.investments,
        };
        // Auto-complete any that finished while away
        checkCompletions();
        for (const l of listeners) l();
      }
    }
  } catch {
    /* start fresh */
  }
}

function checkCompletions(now = Date.now()) {
  let changed = false;
  const next = state.investments.map((inv) => {
    if (inv.status === "active" && now >= inv.endsAt) {
      changed = true;
      return { ...inv, status: "completed" as const };
    }
    return inv;
  });

  if (changed) {
    // Credit profits for newly completed
    let credit = 0;
    for (const inv of next) {
      const prev = state.investments.find((i) => i.id === inv.id);
      if (prev?.status === "active" && inv.status === "completed") {
        credit += inv.amount + inv.profit;
      }
    }
    state = {
      balance: state.balance + credit,
      investments: next,
    };
    persist();
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => state;
const getServerSnapshot = () => state;

export function useInvestments(): InvestmentState {
  useEffect(hydrate, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Live progress that re-renders every second so bars & timers stay smooth */
export function useLiveNow(intervalMs = 1000) {
  return useSyncExternalStore(
    (cb) => {
      const id = setInterval(cb, intervalMs);
      return () => clearInterval(id);
    },
    () => Date.now(),
    () => Date.now(),
  );
}

// ── Actions ───────────────────────────────────────────────────────────
export function createInvestment(
  packageId: number,
  amount: number,
): { ok: true; investment: Investment } | { ok: false; error: string } {
  const pkg = getPackage(packageId);
  if (!pkg) return { ok: false, error: "Package not found" };
  if (amount < pkg.minAmount || amount > pkg.maxAmount) {
    return {
      ok: false,
      error: `Amount must be between $${pkg.minAmount.toLocaleString()} and $${pkg.maxAmount.toLocaleString()}`,
    };
  }
  if (amount > state.balance) {
    return { ok: false, error: "Insufficient balance" };
  }

  const now = Date.now();
  const durationMs = pkg.duration * 24 * 60 * 60 * 1000;
  const profit = (amount * (pkg.increase + pkg.bonus)) / 100;

  const investment: Investment = {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    packageId: pkg.id,
    packageName: pkg.name,
    amount,
    increase: pkg.increase,
    bonus: pkg.bonus,
    durationDays: pkg.duration,
    startedAt: now,
    endsAt: now + durationMs,
    profit,
    status: "active",
  };

  state = {
    balance: state.balance - amount,
    investments: [investment, ...state.investments],
  };
  emit();
  return { ok: true, investment };
}

export function resetInvestments() {
  state = freshState();
  emit();
}

// Periodic completion checker (call once from a top-level component)
export function startInvestmentTicker() {
  if (typeof window === "undefined") return;
  const id = setInterval(() => {
    checkCompletions();
    // notify listeners so progress bars update
    for (const l of listeners) l();
  }, 1000);
  return () => clearInterval(id);
}
