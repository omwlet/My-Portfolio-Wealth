import type { ChartPayload, NewsItem, Quote, SearchResult } from "../types";

const json = async <T>(url: string): Promise<T> => {
  // no-store so live polls always hit the network, never a stale browser cache.
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${body}`.trim());
  }
  return res.json() as Promise<T>;
};

export const api = {
  quote: (symbol: string) => json<Quote>(`/api/quote/${encodeURIComponent(symbol)}`),

  quotes: (symbols: string[]) =>
    json<Record<string, Quote>>(`/api/quotes?symbols=${symbols.join(",")}`),

  chart: (symbol: string, range = "6mo", interval = "1d") =>
    json<ChartPayload>(
      `/api/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
    ),

  fx: (code: string) =>
    json<{ code: string; rate: number }>(`/api/fx?to=${encodeURIComponent(code)}`),

  search: (q: string) =>
    json<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`),

  news: (symbol?: string, limit = 12, lang = "en") =>
    json<{ items: NewsItem[] }>(
      `/api/news?${symbol ? `symbol=${encodeURIComponent(symbol)}&` : ""}limit=${limit}&lang=${lang}`
    ),
};

// Maps a UI range button to Yahoo's {range, interval} pair.
// "4h" is synthetic — the backend fetches 1h bars and aggregates them.
export const RANGE_PRESETS: Record<string, { range: string; interval: string }> = {
  "1m": { range: "1d", interval: "1m" },
  "5m": { range: "5d", interval: "5m" },
  "15m": { range: "1mo", interval: "15m" },
  "4H": { range: "3mo", interval: "4h" },
  "1D": { range: "1d", interval: "5m" },
  "5D": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  YTD: { range: "ytd", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
};
