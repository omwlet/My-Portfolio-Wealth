import type { ChartPayload, NewsItem, Quote } from "../types";

const json = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
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

  news: (symbol?: string, limit = 12, lang = "en") =>
    json<{ items: NewsItem[] }>(
      `/api/news?${symbol ? `symbol=${encodeURIComponent(symbol)}&` : ""}limit=${limit}&lang=${lang}`
    ),
};

// Maps a UI range button to Yahoo's {range, interval} pair.
export const RANGE_PRESETS: Record<string, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "5D": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  YTD: { range: "ytd", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
};
