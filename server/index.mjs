// =====================================================================
//  Portfolio Health API server
//  Thin proxy over public Yahoo Finance endpoints (quotes, OHLC, news).
//  No API key required. Runs on :8787; Vite proxies /api -> here.
// =====================================================================
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";

const app = express();
// In production the host (Render) injects PORT and we serve the built site here.
// In dev we use a dedicated var so we never collide with Vite's PORT.
const PORT = isProd ? process.env.PORT || 8787 : process.env.API_PORT || 8787;

const YH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json,text/plain,*/*",
};

// Try query1 first, fall back to query2 (Yahoo load-balances these).
async function yfetch(path) {
  const hosts = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];
  let lastErr;
  for (const host of hosts) {
    try {
      const res = await fetch(host + path, { headers: YH_HEADERS });
      if (res.ok) return await res.json();
      lastErr = new Error(`${res.status} ${res.statusText}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Yahoo fetch failed");
}

// ---- Chart / candles -------------------------------------------------
async function getChart(symbol, range = "6mo", interval = "1d") {
  const data = await yfetch(
    `/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`
  );
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error("No chart data");
  const meta = result.meta ?? {};
  const ts = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};
  const candles = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i];
    const h = q.high?.[i];
    const l = q.low?.[i];
    const c = q.close?.[i];
    if (o == null || h == null || l == null || c == null) continue;
    candles.push({
      time: ts[i],
      open: +o.toFixed(4),
      high: +h.toFixed(4),
      low: +l.toFixed(4),
      close: +c.toFixed(4),
      volume: q.volume?.[i] ?? 0,
    });
  }
  return { meta, candles };
}

function quoteFromMeta(symbol, meta) {
  const price = meta.regularMarketPrice ?? meta.previousClose ?? 0;
  const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - previousClose;
  const changePct = previousClose ? (change / previousClose) * 100 : 0;
  return {
    symbol: meta.symbol ?? symbol,
    name: meta.longName ?? meta.shortName ?? NAMES[symbol] ?? symbol,
    price: +price.toFixed(2),
    previousClose: +previousClose.toFixed(2),
    change: +change.toFixed(2),
    changePct: +changePct.toFixed(2),
    currency: meta.currency ?? "USD",
    exchange: meta.fullExchangeName ?? meta.exchangeName ?? "",
    high52: meta.fiftyTwoWeekHigh ?? null,
    low52: meta.fiftyTwoWeekLow ?? null,
    ts: new Date().toISOString(),
  };
}

// Friendly names for common tickers (Yahoo chart meta omits these sometimes).
const NAMES = {
  LLY: "Eli Lilly and Company",
  MSFT: "Microsoft Corporation",
  GOOGL: "Alphabet Inc.",
  GOOG: "Alphabet Inc.",
  NVDA: "NVIDIA Corporation",
  SOFI: "SoFi Technologies, Inc.",
  AAPL: "Apple Inc.",
  AMZN: "Amazon.com, Inc.",
  META: "Meta Platforms, Inc.",
  TSLA: "Tesla, Inc.",
  ISRG: "Intuitive Surgical, Inc.",
};

// ---- Translation (free Google endpoint, cached, best-effort) ---------
const translateCache = new Map(); // `${lang}:${text}` -> translated

async function translateText(text, target) {
  if (!text || target === "en") return text;
  const key = `${target}:${text}`;
  if (translateCache.has(key)) return translateCache.get(key);
  try {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}` +
      `&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { headers: YH_HEADERS, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    // data[0] is an array of [translatedSegment, originalSegment, ...]
    const out = (data?.[0] ?? []).map((seg) => seg?.[0] ?? "").join("");
    const result = out || text;
    translateCache.set(key, result);
    return result;
  } catch {
    return text; // fall back to the original headline
  }
}

// ---- Routes ----------------------------------------------------------
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/quote/:symbol", async (req, res) => {
  try {
    const { meta } = await getChart(req.params.symbol, "1d", "5m");
    res.json(quoteFromMeta(req.params.symbol.toUpperCase(), meta));
  } catch (e) {
    res.status(502).json({ error: String(e?.message ?? e) });
  }
});

app.get("/api/quotes", async (req, res) => {
  const symbols = String(req.query.symbols ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const out = {};
  await Promise.all(
    symbols.map(async (sym) => {
      try {
        const { meta } = await getChart(sym, "1d", "5m");
        out[sym] = quoteFromMeta(sym, meta);
      } catch {
        /* skip unresolved symbol */
      }
    })
  );
  res.json(out);
});

app.get("/api/chart/:symbol", async (req, res) => {
  try {
    const range = String(req.query.range ?? "6mo");
    const interval = String(req.query.interval ?? "1d");
    const { meta, candles } = await getChart(req.params.symbol, range, interval);
    res.json({
      symbol: req.params.symbol.toUpperCase(),
      range,
      interval,
      candles,
      meta: {
        price: meta.regularMarketPrice ?? 0,
        previousClose: meta.chartPreviousClose ?? meta.previousClose ?? 0,
        currency: meta.currency ?? "USD",
      },
    });
  } catch (e) {
    res.status(502).json({ error: String(e?.message ?? e) });
  }
});

app.get("/api/news", async (req, res) => {
  try {
    const symbol = req.query.symbol ? String(req.query.symbol) : "";
    const limit = Math.min(Number(req.query.limit ?? 12), 30);
    const lang = String(req.query.lang ?? "en");
    // Yahoo search endpoint returns a clean news[] array.
    const q = symbol || "stock market";
    const data = await yfetch(
      `/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=${limit}&quotesCount=0&enableFuzzyQuery=false`
    );
    const raw = (data?.news ?? []).slice(0, limit);

    // Optionally translate the (English) headlines into the UI language.
    const titles =
      lang === "en"
        ? raw.map((n) => n.title)
        : await Promise.all(raw.map((n) => translateText(n.title, lang)));

    const items = raw.map((n, i) => ({
      title: titles[i],
      titleOriginal: n.title,
      link: n.link,
      publisher: n.publisher ?? "Yahoo Finance",
      published: n.providerPublishTime
        ? new Date(n.providerPublishTime * 1000).toISOString()
        : new Date().toISOString(),
      summary: n.summary ?? "",
      symbol: symbol || (n.relatedTickers?.[0] ?? undefined),
    }));
    res.json({ items });
  } catch (e) {
    res.status(502).json({ error: String(e?.message ?? e), items: [] });
  }
});

// ---- Serve the built frontend in production (single-service deploy) ----
if (isProd) {
  const dist = path.join(__dirname, "..", "dist");
  app.use(express.static(dist));
  // SPA fallback: any non-API route returns index.html.
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(PORT, () => {
  const mode = isProd ? "production (serving site + API)" : "dev (API only)";
  console.log(`[portfolio-health] ${mode} on http://localhost:${PORT}`);
});
