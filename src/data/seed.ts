import type { Holding } from "../types";

// Initial holdings (the user's real positions). These seed localStorage on
// first load; afterwards the user can add/edit/remove from the UI.
export const SEED_HOLDINGS: Holding[] = [
  { id: "lly", symbol: "LLY", shares: 24.56, avgCost: 907.7824 },
  { id: "msft", symbol: "MSFT", shares: 18.76, avgCost: 409.3125 },
  { id: "googl", symbol: "GOOGL", shares: 10.83, avgCost: 332.3743 },
  { id: "nvda", symbol: "NVDA", shares: 3.87, avgCost: 178.928 },
  { id: "sofi", symbol: "SOFI", shares: 5.51, avgCost: 15.408 },
];
