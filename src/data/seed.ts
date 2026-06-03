import type { Holding } from "../types";

// The user invests a *dollar amount* into each name (fractional shares), so the
// figures below are USD invested, not share counts. Actual shares are derived:
//   shares = usd / avgCost  (=> cost basis == usd)
const SEED_USD: { id: string; symbol: string; usd: number; avgCost: number }[] = [
  { id: "lly", symbol: "LLY", usd: 24.56, avgCost: 907.7824 },
  { id: "msft", symbol: "MSFT", usd: 18.76, avgCost: 409.3125 },
  { id: "googl", symbol: "GOOGL", usd: 10.83, avgCost: 332.3743 },
  { id: "nvda", symbol: "NVDA", usd: 3.87, avgCost: 178.928 },
  { id: "sofi", symbol: "SOFI", usd: 5.51, avgCost: 15.408 },
];

export const SEED_HOLDINGS: Holding[] = SEED_USD.map((h) => ({
  id: h.id,
  symbol: h.symbol,
  shares: +(h.usd / h.avgCost).toFixed(6),
  avgCost: h.avgCost,
}));
