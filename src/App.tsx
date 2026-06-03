import { useEffect, useMemo, useRef, useState } from "react";
import { usePortfolio } from "./context/PortfolioContext";
import { useAssetData } from "./hooks/useAssetData";
import { deriveLevels } from "./lib/calc";
import { AssetHeader } from "./components/AssetHeader";
import { ChartControls, type ChartType, type Overlays } from "./components/ChartControls";
import { PriceChart } from "./components/PriceChart";
import { SubChart } from "./components/SubChart";
import { PositionPanel } from "./components/PositionPanel";
import { PortfolioOverview } from "./components/PortfolioOverview";
import { PortfolioAnalysis } from "./components/PortfolioAnalysis";
import { NewsFeed } from "./components/NewsFeed";
import { Spinner } from "./components/ui";

export default function App() {
  const { selectedSymbol, quotes, stats, loading } = usePortfolio();
  const quote = quotes[selectedSymbol];

  // Chart UI state
  const [range, setRange] = useState("6M");
  const [chartType, setChartType] = useState<ChartType>("candles");
  const [overlays, setOverlays] = useState<Overlays>({
    sr: true,
    bollinger: false,
    sma: false,
  });
  const [sub, setSub] = useState<"rsi" | "volume">("rsi");

  const { chart, loading: chartLoading, error } = useAssetData(selectedSymbol, range);
  const candles = chart?.candles ?? [];
  const price = quote?.price ?? chart?.meta.price ?? 0;

  // Calculator state
  const [investment, setInvestment] = useState(1000);
  const [locked, setLocked] = useState(false);
  const [useCurrentPrice, setUseCurrentPrice] = useState(false);
  const [supports, setSupports] = useState<number[]>([0, 0, 0]);
  const [resistances, setResistances] = useState<number[]>([0, 0, 0, 0]);
  const levelsSymbol = useRef<string>("");

  // Re-derive S/R baselines whenever we load a *new* symbol's chart.
  useEffect(() => {
    if (!chart || !candles.length) return;
    if (levelsSymbol.current === chart.symbol) return;
    const { supports: s, resistances: r } = deriveLevels(candles, price || chart.meta.price);
    setSupports(s);
    setResistances(r);
    levelsSymbol.current = chart.symbol;
  }, [chart, candles, price]);

  const resetLevels = () => {
    if (!candles.length) return;
    const { supports: s, resistances: r } = deriveLevels(candles, price);
    setSupports(s);
    setResistances(r);
  };

  // When "use current price" is on, the first entry becomes the live price.
  const effectiveSupports = useMemo(() => {
    if (!useCurrentPrice || !price) return supports;
    return [price, ...supports.slice(1)];
  }, [useCurrentPrice, price, supports]);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <TopBar />

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 pb-12 pt-4">
        {/* ===== Split screen: chart (2/3) + calculator (1/3) ===== */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* LEFT 2/3 */}
          <div className="lg:col-span-2 overflow-hidden rounded-xl border border-border bg-panel">
            <AssetHeader quote={quote} symbol={selectedSymbol} />
            <ChartControls
              range={range}
              setRange={setRange}
              chartType={chartType}
              setChartType={setChartType}
              overlays={overlays}
              setOverlays={setOverlays}
              sub={sub}
              setSub={setSub}
            />
            <div className="relative h-[420px] w-full">
              {chartLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-panel/70">
                  <Spinner label={`Loading ${selectedSymbol} chart…`} />
                </div>
              )}
              {error && !chartLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-down">
                  Chart unavailable: {error}
                </div>
              )}
              <PriceChart
                candles={candles}
                chartType={chartType}
                overlays={overlays}
                supports={effectiveSupports}
                resistances={resistances}
              />
            </div>
            <div className="h-[150px] w-full border-t border-border">
              <div className="px-4 pt-2 text-xs font-semibold text-ink-dim">
                {sub === "rsi" ? "RSI (14)" : "Volume"}
              </div>
              <div className="h-[120px] w-full">
                <SubChart candles={candles} kind={sub} />
              </div>
            </div>
          </div>

          {/* RIGHT 1/3 */}
          <div className="lg:col-span-1">
            <PositionPanel
              symbol={selectedSymbol}
              currentPrice={price}
              investment={investment}
              setInvestment={setInvestment}
              locked={locked}
              setLocked={setLocked}
              useCurrentPrice={useCurrentPrice}
              setUseCurrentPrice={setUseCurrentPrice}
              supports={effectiveSupports}
              resistances={resistances}
              setSupport={(i, v) =>
                setSupports((prev) => prev.map((x, idx) => (idx === i ? v : x)))
              }
              setResistance={(i, v) =>
                setResistances((prev) => prev.map((x, idx) => (idx === i ? v : x)))
              }
              onReset={resetLevels}
            />
          </div>
        </div>

        {/* ===== Portfolio management ===== */}
        <PortfolioOverview />

        {/* ===== Analysis + News ===== */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PortfolioAnalysis />
          </div>
          <div className="lg:col-span-1">
            <NewsFeed />
          </div>
        </div>

        <footer className="pt-2 text-center text-xs text-ink-dim">
          Live data via Yahoo Finance · {stats.positions.length} positions ·
          {loading ? " syncing…" : " auto-refresh 60s"} · For research only, not financial
          advice.
        </footer>
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-up/20 text-up">
            ◆
          </span>
          <span className="text-lg font-bold tracking-tight">Portfolio Health</span>
          <span className="ml-1 rounded bg-panel-2 px-1.5 py-0.5 text-[10px] font-semibold text-ink-dim">
            LIVE
          </span>
        </div>
        <nav className="hidden gap-6 text-sm text-ink-dim sm:flex">
          <span className="text-ink">Dashboard</span>
          <span>Holdings</span>
          <span>News</span>
        </nav>
      </div>
    </header>
  );
}
