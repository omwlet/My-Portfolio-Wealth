# Portfolio Health

A dark-themed, TradingView-inspired single-page dashboard for tracking portfolio
health, cost-averaging entries, and live market news.

![dark dashboard](https://img.shields.io/badge/theme-dark-121212) ![live](https://img.shields.io/badge/data-live%20Yahoo%20Finance-00e08a)

## Features

- **Split-screen layout** — interactive price chart (2/3) + position/entry calculator (1/3).
- **Live chart** (TradingView Lightweight Charts): candlestick / Heikin-Ashi / line,
  ranges `1D 5D 1M 6M YTD 1Y`, overlays for **multi-colored S/R lines** (with price
  tags on the right axis), Bollinger Bands, SMA 50, and an **RSI / Volume sub-chart**.
- **Support/Resistance calculator matrix** (`ตารางคำนวณ แนวรับ-แนวต้าน`) — for every
  support (S1–S3) × resistance (R1–R4) it shows the absolute profit and % return for a
  chosen investment amount. Levels are auto-derived from price action and fully editable;
  "Lock amount" and "Use current price" options included.
- **Portfolio management** — add / merge / remove holdings (persisted to `localStorage`),
  click any row to load its chart.
- **Portfolio Health analysis** — total value, cost basis, unrealized & daily P/L,
  allocation breakdown, best/worst, concentration warning, and a 0–100 health score.
- **Market news** — real headlines per selected ticker or across the whole portfolio.

Your starting positions (LLY, MSFT, GOOGL, NVDA, SOFI) are seeded in
[`src/data/seed.ts`](src/data/seed.ts).

## Tech stack

React 18 · TypeScript · Vite 6 · Tailwind CSS v4 · Lightweight-Charts · Express (data proxy).

## Run

```bash
npm install
npm run dev      # starts Vite (http://localhost:5173) + API (http://localhost:8787)
```

Open http://localhost:5173. Live quotes refresh every 60s.

- `npm run web` — frontend only
- `npm run server` — API only
- `npm run build` — type-check + production build

## How it works

The browser never calls Yahoo directly (CORS). A tiny Express server in
[`server/index.mjs`](server/index.mjs) proxies public Yahoo Finance endpoints:

| Route | Purpose |
| --- | --- |
| `GET /api/quote/:symbol` | live quote (price, change, 52w range) |
| `GET /api/quotes?symbols=A,B` | batch quotes for the portfolio |
| `GET /api/chart/:symbol?range=&interval=` | OHLCV candles |
| `GET /api/news?symbol=&limit=` | recent headlines |

Vite proxies `/api/*` → `http://localhost:8787` in dev.

### Calculator math ([`src/lib/calc.ts`](src/lib/calc.ts))

```
shares    = investment / support          (entry)
proceeds  = shares * resistance           (exit)
profit    = proceeds - investment
profit %  = (resistance / support - 1) * 100   // independent of amount
```

> For research/education only — not financial advice.
