// ----- Shared domain types -----

export interface Holding {
  id: string;
  symbol: string;
  shares: number;
  avgCost: number;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  currency: string;
  exchange: string;
  high52: number | null;
  low52: number | null;
  marketCap?: number | null;
  ts: string;
}

export interface Candle {
  // lightweight-charts expects time as UNIX seconds (UTCTimestamp)
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartPayload {
  symbol: string;
  range: string;
  interval: string;
  candles: Candle[];
  meta: {
    price: number;
    previousClose: number;
    currency: string;
  };
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string; // EQUITY, ETF, INDEX, CRYPTOCURRENCY, CURRENCY...
}

export interface NewsItem {
  title: string;
  titleOriginal?: string;
  link: string;
  publisher: string;
  published: string; // ISO
  summary: string;
  symbol?: string;
}

// A holding enriched with its live quote and derived P/L metrics.
export interface EnrichedHolding extends Holding {
  quote?: Quote;
  marketValue: number;
  costBasis: number;
  unrealized: number;
  unrealizedPct: number;
  dayChange: number;
  weight: number; // % of total portfolio market value
}

export interface PortfolioStats {
  marketValue: number; // includes cash
  investedValue: number; // market value of stocks only (excludes cash)
  costBasis: number; // stock cost basis + cash
  unrealized: number;
  unrealizedPct: number;
  dayChange: number;
  dayChangePct: number;
  positions: EnrichedHolding[];
  best?: EnrichedHolding;
  worst?: EnrichedHolding;
  concentration: number; // largest single-position weight %
  cash: number;
  cashWeight: number; // cash as % of total value
}
