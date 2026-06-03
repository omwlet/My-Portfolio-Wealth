import type {
  Candle,
  EnrichedHolding,
  Holding,
  PortfolioStats,
  Quote,
} from "../types";

// =====================================================================
//  Support / Resistance calculator matrix
// =====================================================================

export interface MatrixCell {
  support: number;
  resistance: number;
  /** shares you could buy with the investment amount at this support */
  shares: number;
  /** absolute profit if bought at support, sold at resistance */
  profit: number;
  /** percentage return */
  profitPct: number;
  /** total proceeds at the resistance target */
  proceeds: number;
}

/**
 * Build the support x resistance profit matrix.
 *
 * For each support (entry) and resistance (exit):
 *   shares  = investment / support
 *   proceeds = shares * resistance
 *   profit   = proceeds - investment
 *   profitPct = (resistance / support - 1) * 100
 *
 * Note: profitPct is independent of the invested amount, while the absolute
 * profit scales linearly with it.
 */
export function buildMatrix(
  investment: number,
  supports: number[],
  resistances: number[]
): MatrixCell[][] {
  return supports.map((support) =>
    resistances.map((resistance) => {
      const shares = support > 0 ? investment / support : 0;
      const proceeds = shares * resistance;
      const profit = proceeds - investment;
      const profitPct = support > 0 ? (resistance / support - 1) * 100 : 0;
      return { support, resistance, shares, profit, profitPct, proceeds };
    })
  );
}

// =====================================================================
//  Cost-averaging ("buy more / average down") helper
// =====================================================================

export interface AvgRow {
  level: number; // support price you'd buy more at
  addAmount: number; // dollars added at this level
  addShares: number; // shares that buys
  newShares: number; // resulting total shares
  newAvg: number; // resulting blended average cost
  averagingDown: boolean; // true if new avg is below current avg
}

/**
 * For a held position, compute the new blended average cost if you invest
 * `addAmount` more dollars at each price level.
 *   addShares = addAmount / level
 *   newAvg    = (curShares*curAvg + addAmount) / (curShares + addShares)
 */
export function buildAveraging(
  currentShares: number,
  currentAvg: number,
  addAmount: number,
  levels: number[]
): AvgRow[] {
  return levels.map((level) => {
    const addShares = level > 0 ? addAmount / level : 0;
    const newShares = currentShares + addShares;
    const newAvg =
      newShares > 0
        ? (currentShares * currentAvg + addAmount) / newShares
        : currentAvg;
    return {
      level,
      addAmount,
      addShares,
      newShares,
      newAvg,
      averagingDown: newAvg < currentAvg,
    };
  });
}

/**
 * Derive default support/resistance levels from recent price action.
 * Uses the full loaded window so levels reflect the selected timeframe.
 */
export function deriveLevels(
  candles: Candle[],
  currentPrice: number
): { supports: number[]; resistances: number[] } {
  const p = currentPrice || candles[candles.length - 1]?.close || 100;
  if (!candles.length) {
    // Fallback: simple percentage bands around the current price.
    return {
      supports: [p * 0.97, p * 0.93, p * 0.88].map(round2),
      resistances: [p * 1.03, p * 1.07, p * 1.12, p * 1.18].map(round2),
    };
  }

  // Use the FULL loaded window so the levels reflect the selected timeframe:
  // a 1Y view spans its 52-week range, a 1M view stays tight.
  const swingHigh = Math.max(...candles.map((c) => c.high));
  const swingLow = Math.min(...candles.map((c) => c.low));

  // Distance from price down to the period low / up to the period high, with a
  // floor (6% of price) so levels never collapse when price sits at an extreme.
  const lowGap = Math.max(p - swingLow, p * 0.06);
  const highGap = Math.max(swingHigh - p, p * 0.06);

  const supports = [p - lowGap * 0.33, p - lowGap * 0.66, p - lowGap]
    .map(round2)
    .sort((a, b) => b - a);

  const resistances = [
    p + highGap * 0.33,
    p + highGap * 0.66,
    p + highGap,
    p + highGap * 1.4,
  ]
    .map(round2)
    .sort((a, b) => a - b);

  return { supports, resistances };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// =====================================================================
//  Technical indicators (for the sub-chart)
// =====================================================================

/** Wilder's RSI. Returns an array aligned to candles (NaN until warmed up). */
export function computeRSI(candles: Candle[], period = 14): { time: number; value: number }[] {
  const out: { time: number; value: number }[] = [];
  if (candles.length <= period) return out;

  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    out.push({ time: candles[i].time, value: round2(rsi) });
  }
  return out;
}

/** Simple moving average series. */
export function computeSMA(candles: Candle[], period: number) {
  const out: { time: number; value: number }[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) out.push({ time: candles[i].time, value: round2(sum / period) });
  }
  return out;
}

/** Bollinger Bands (period 20, 2 std-dev). */
export function computeBollinger(candles: Candle[], period = 20, mult = 2) {
  const upper: { time: number; value: number }[] = [];
  const lower: { time: number; value: number }[] = [];
  const mid: { time: number; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((s, c) => s + c.close, 0) / period;
    const variance =
      slice.reduce((s, c) => s + (c.close - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    const t = candles[i].time;
    mid.push({ time: t, value: round2(mean) });
    upper.push({ time: t, value: round2(mean + mult * sd) });
    lower.push({ time: t, value: round2(mean - mult * sd) });
  }
  return { upper, lower, mid };
}

/** Convert OHLC candles to Heikin-Ashi candles. */
export function toHeikinAshi(candles: Candle[]): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const prev = out[i - 1];
    const haOpen = prev ? (prev.open + prev.close) / 2 : (c.open + c.close) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);
    out.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume,
    });
  }
  return out;
}

// =====================================================================
//  Portfolio analytics
// =====================================================================

export function enrichHoldings(
  holdings: Holding[],
  quotes: Record<string, Quote>
): PortfolioStats {
  const positions: EnrichedHolding[] = holdings.map((h) => {
    const quote = quotes[h.symbol];
    const price = quote?.price ?? h.avgCost;
    const marketValue = price * h.shares;
    const costBasis = h.avgCost * h.shares;
    const unrealized = marketValue - costBasis;
    const unrealizedPct = costBasis > 0 ? (unrealized / costBasis) * 100 : 0;
    const dayChange = (quote?.change ?? 0) * h.shares;
    return {
      ...h,
      quote,
      marketValue,
      costBasis,
      unrealized,
      unrealizedPct,
      dayChange,
      weight: 0,
    };
  });

  const marketValue = sum(positions.map((p) => p.marketValue));
  const costBasis = sum(positions.map((p) => p.costBasis));
  const unrealized = marketValue - costBasis;
  const unrealizedPct = costBasis > 0 ? (unrealized / costBasis) * 100 : 0;
  const dayChange = sum(positions.map((p) => p.dayChange));
  const prevValue = marketValue - dayChange;
  const dayChangePct = prevValue > 0 ? (dayChange / prevValue) * 100 : 0;

  for (const p of positions) {
    p.weight = marketValue > 0 ? (p.marketValue / marketValue) * 100 : 0;
  }

  const byPnl = [...positions].sort((a, b) => b.unrealizedPct - a.unrealizedPct);
  const concentration = positions.length
    ? Math.max(...positions.map((p) => p.weight))
    : 0;

  return {
    marketValue,
    costBasis,
    unrealized,
    unrealizedPct,
    dayChange,
    dayChangePct,
    positions,
    best: byPnl[0],
    worst: byPnl[byPnl.length - 1],
    concentration,
  };
}

function sum(arr: number[]): number {
  return arr.reduce((s, n) => s + n, 0);
}

// =====================================================================
//  Actionable recommendations ("what to do next")
// =====================================================================

export type RecSeverity = "warn" | "info" | "good";

export interface Recommendation {
  id: string;
  severity: RecSeverity;
  /** i18n key in src/i18n.ts */
  key: string;
  /** interpolation params for the i18n string */
  params: Record<string, string | number>;
}

const TARGET_CONCENTRATION = 30; // % — single-position ceiling we aim for

export function buildRecommendations(stats: PortfolioStats): Recommendation[] {
  const recs: Recommendation[] = [];
  if (!stats.positions.length) return recs;

  const byWeight = [...stats.positions].sort((a, b) => b.weight - a.weight);
  const top = byWeight[0];

  // 1) Over-concentration — tell them exactly how much to trim.
  if (top && top.weight > TARGET_CONCENTRATION + 1) {
    const targetValue = (TARGET_CONCENTRATION / 100) * stats.marketValue;
    const trimAmount = Math.max(0, top.marketValue - targetValue);
    const price = top.quote?.price ?? top.avgCost;
    const trimShares = price > 0 ? trimAmount / price : 0;
    recs.push({
      id: "trim",
      severity: "warn",
      key: "recs.trim",
      params: {
        sym: top.symbol,
        pct: fmtPctPlain(top.weight),
        target: `${TARGET_CONCENTRATION}%`,
        amt: fmtMoney(trimAmount),
        sh: trimShares.toFixed(2),
      },
    });
  }

  // 2) Too few names — diversification.
  if (stats.positions.length < 4) {
    recs.push({
      id: "diversify",
      severity: "info",
      key: "recs.diversify",
      params: { n: stats.positions.length },
    });
  }

  // 3) Big loser — review/cut.
  if (stats.worst && stats.worst.unrealizedPct < -15) {
    recs.push({
      id: "cutLoss",
      severity: "warn",
      key: "recs.cutLoss",
      params: {
        sym: stats.worst.symbol,
        pct: fmtPctPlain(Math.abs(stats.worst.unrealizedPct)),
      },
    });
  }

  // 4) Big winner — take some profit / rebalance.
  if (stats.best && stats.best.unrealizedPct > 25) {
    recs.push({
      id: "takeProfit",
      severity: "info",
      key: "recs.takeProfit",
      params: { sym: stats.best.symbol, pct: fmtPctPlain(stats.best.unrealizedPct) },
    });
  }

  // 5) Big daily swing — behavioural nudge.
  if (Math.abs(stats.dayChangePct) > 3) {
    recs.push({
      id: "dayMove",
      severity: "info",
      key: "recs.dayMove",
      params: { pct: fmtPct(stats.dayChangePct) },
    });
  }

  // Nothing pressing → reassuring note.
  if (!recs.some((r) => r.severity === "warn")) {
    recs.unshift({
      id: "balanced",
      severity: "good",
      key: "recs.balanced",
      params: {},
    });
  }

  return recs;
}

// =====================================================================
//  Formatting helpers
// =====================================================================

export const fmtMoney = (n: number, digits = 2): string =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const fmtNum = (n: number, digits = 2): string =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const fmtPct = (n: number, digits = 2): string =>
  `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;

// Unsigned percentage — for weights/concentration where a +/- prefix is wrong.
export const fmtPctPlain = (n: number, digits = 1): string =>
  `${n.toFixed(digits)}%`;

export const fmtSigned = (n: number, digits = 2): string =>
  `${n >= 0 ? "+" : "-"}${fmtMoney(Math.abs(n), digits)}`;

export const fmtCompact = (n: number): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
};
