import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";

export interface Currency {
  code: string;
  symbol: string;
  digits: number;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", digits: 2 },
  { code: "THB", symbol: "฿", digits: 2 },
  { code: "EUR", symbol: "€", digits: 2 },
  { code: "GBP", symbol: "£", digits: 2 },
  { code: "JPY", symbol: "¥", digits: 0 },
  { code: "SGD", symbol: "S$", digits: 2 },
  { code: "AUD", symbol: "A$", digits: 2 },
];

interface CurrencyContextValue {
  currency: Currency;
  setCode: (code: string) => void;
  rate: number; // units of `currency` per 1 USD
  /** format a USD amount in the selected currency */
  money: (usd: number, digits?: number) => string;
  /** convert a value typed in the selected currency back to USD */
  toUsd: (val: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);
const KEY = "portfolio-health.currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCodeState] = useState<string>(
    () => localStorage.getItem(KEY) || "USD"
  );
  const [rate, setRate] = useState(1);

  const currency = useMemo(
    () => CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0],
    [code]
  );

  useEffect(() => {
    localStorage.setItem(KEY, code);
    let cancelled = false;
    if (code === "USD") {
      setRate(1);
      return;
    }
    api
      .fx(code)
      .then((r) => {
        if (!cancelled) setRate(r.rate || 1);
      })
      .catch(() => {
        if (!cancelled) setRate(1);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const money = useCallback(
    (usd: number, digits?: number) => {
      const d = digits ?? currency.digits;
      const val = usd * rate;
      return `${currency.symbol}${val.toLocaleString("en-US", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      })}`;
    },
    [currency, rate]
  );

  const toUsd = useCallback((val: number) => (rate ? val / rate : val), [rate]);

  const value = useMemo(
    () => ({ currency, setCode: setCodeState, rate, money, toUsd }),
    [currency, rate, money, toUsd]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
