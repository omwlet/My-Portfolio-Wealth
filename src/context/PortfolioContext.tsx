import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";
import { enrichHoldings } from "../lib/calc";
import { SEED_HOLDINGS } from "../data/seed";
import type { Holding, PortfolioStats, Quote } from "../types";

// v2: seed figures are USD invested -> shares = usd / avgCost (re-seed needed).
const STORAGE_KEY = "portfolio-health.holdings.v2";
const CASH_KEY = "portfolio-health.cash.v1";

interface PortfolioContextValue {
  holdings: Holding[];
  quotes: Record<string, Quote>;
  stats: PortfolioStats;
  loading: boolean;
  lastUpdated: Date | null;
  selectedSymbol: string;
  setSelectedSymbol: (s: string) => void;
  addHolding: (h: Omit<Holding, "id">) => void;
  updateHolding: (id: string, patch: Partial<Holding>) => void;
  removeHolding: (id: string) => void;
  cash: number;
  setCash: (n: number) => void;
  addCash: (n: number) => void;
  refresh: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

function loadHoldings(): Holding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Holding[];
  } catch {
    /* ignore */
  }
  return SEED_HOLDINGS;
}

function loadCash(): number {
  const raw = localStorage.getItem(CASH_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>(loadHoldings);
  const [cash, setCashState] = useState<number>(loadCash);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    () => loadHoldings()[0]?.symbol ?? "LLY"
  );
  const timer = useRef<number | null>(null);

  // Persist holdings + cash.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  }, [holdings]);
  useEffect(() => {
    localStorage.setItem(CASH_KEY, String(cash));
  }, [cash]);

  const setCash = useCallback((n: number) => setCashState(Math.max(0, n || 0)), []);
  const addCash = useCallback(
    (n: number) => setCashState((c) => Math.max(0, c + (n || 0))),
    []
  );

  // Poll quotes for all holdings + whatever symbol is currently being viewed
  // (so a searched, non-held ticker still gets a live header quote).
  const symbols = useMemo(
    () =>
      Array.from(
        new Set([...holdings.map((h) => h.symbol), selectedSymbol].filter(Boolean))
      ),
    [holdings, selectedSymbol]
  );

  const refresh = useCallback(async () => {
    if (!symbols.length) {
      setQuotes({});
      setLoading(false);
      return;
    }
    try {
      const next = await api.quotes(symbols);
      setQuotes((prev) => ({ ...prev, ...next }));
      setLastUpdated(new Date());
    } catch (e) {
      console.error("quote refresh failed", e);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  // Initial load + 60s polling.
  useEffect(() => {
    refresh();
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(refresh, 60_000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [refresh]);

  // If the selected symbol becomes empty, fall back to the first holding.
  // (We intentionally allow viewing symbols that aren't held — e.g. via search.)
  useEffect(() => {
    if (!selectedSymbol && holdings.length) {
      setSelectedSymbol(holdings[0].symbol);
    }
  }, [holdings, selectedSymbol]);

  const addHolding = useCallback((h: Omit<Holding, "id">) => {
    setHoldings((prev) => {
      const symbol = h.symbol.toUpperCase().trim();
      const existing = prev.find((p) => p.symbol === symbol);
      if (existing) {
        // Merge: weighted-average the cost basis.
        const totalShares = existing.shares + h.shares;
        const avgCost =
          totalShares > 0
            ? (existing.shares * existing.avgCost + h.shares * h.avgCost) /
              totalShares
            : h.avgCost;
        return prev.map((p) =>
          p.id === existing.id
            ? { ...p, shares: totalShares, avgCost: +avgCost.toFixed(4) }
            : p
        );
      }
      return [
        ...prev,
        { ...h, symbol, id: `${symbol.toLowerCase()}-${Date.now()}` },
      ];
    });
  }, []);

  const updateHolding = useCallback((id: string, patch: Partial<Holding>) => {
    setHoldings((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const removeHolding = useCallback((id: string) => {
    setHoldings((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const stats = useMemo(
    () => enrichHoldings(holdings, quotes, cash),
    [holdings, quotes, cash]
  );

  const value: PortfolioContextValue = {
    holdings,
    quotes,
    stats,
    loading,
    lastUpdated,
    selectedSymbol,
    setSelectedSymbol,
    addHolding,
    updateHolding,
    removeHolding,
    cash,
    setCash,
    addCash,
    refresh,
  };

  return (
    <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}
