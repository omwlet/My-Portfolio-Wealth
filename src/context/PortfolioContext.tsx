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

const STORAGE_KEY = "portfolio-health.holdings.v1";

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

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>(loadHoldings);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    () => loadHoldings()[0]?.symbol ?? "LLY"
  );
  const timer = useRef<number | null>(null);

  // Persist holdings.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  }, [holdings]);

  const symbols = useMemo(
    () => Array.from(new Set(holdings.map((h) => h.symbol))),
    [holdings]
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

  // Keep selection valid.
  useEffect(() => {
    if (holdings.length && !holdings.some((h) => h.symbol === selectedSymbol)) {
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

  const stats = useMemo(() => enrichHoldings(holdings, quotes), [holdings, quotes]);

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
