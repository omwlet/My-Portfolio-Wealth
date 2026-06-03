import { useEffect, useMemo, useRef, useState } from "react";
import { usePortfolio } from "./context/PortfolioContext";
import { useUI } from "./context/UIContext";
import { useAssetData } from "./hooks/useAssetData";
import { deriveLevels } from "./lib/calc";
import { LANGS } from "./i18n";
import { AssetHeader } from "./components/AssetHeader";
import { ChartControls, type ChartType, type Overlays } from "./components/ChartControls";
import { PriceChart } from "./components/PriceChart";
import { SubChart } from "./components/SubChart";
import { PositionPanel } from "./components/PositionPanel";
import { PortfolioOverview } from "./components/PortfolioOverview";
import { PortfolioAnalysis } from "./components/PortfolioAnalysis";
import { NewsFeed } from "./components/NewsFeed";
import { Spinner, cn } from "./components/ui";

export default function App() {
  const { selectedSymbol, quotes, stats } = usePortfolio();
  const { theme, t } = useUI();
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
  // Key on symbol + timeframe so S/R re-derive when EITHER changes.
  const levelsKey = useRef<string>("");

  useEffect(() => {
    if (!chart || !candles.length) return;
    const key = `${chart.symbol}:${chart.range}`;
    if (levelsKey.current === key) return;
    const { supports: s, resistances: r } = deriveLevels(candles, price || chart.meta.price);
    setSupports(s);
    setResistances(r);
    levelsKey.current = key;
  }, [chart, candles, price]);

  const resetLevels = () => {
    if (!candles.length) return;
    const { supports: s, resistances: r } = deriveLevels(candles, price);
    setSupports(s);
    setResistances(r);
  };

  const effectiveSupports = useMemo(() => {
    if (!useCurrentPrice || !price) return supports;
    return [price, ...supports.slice(1)];
  }, [useCurrentPrice, price, supports]);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <TopBar />

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 pb-12 pt-4">
        {/* ===== Split screen: chart (2/3) + calculator (1/3) ===== */}
        <section id="dashboard" className="grid scroll-mt-20 gap-4 lg:grid-cols-3">
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
                  <Spinner label={t("chart.loading", { sym: selectedSymbol })} />
                </div>
              )}
              {error && !chartLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-down">
                  {t("chart.unavailable", { err: error })}
                </div>
              )}
              <PriceChart
                candles={candles}
                chartType={chartType}
                overlays={overlays}
                supports={effectiveSupports}
                resistances={resistances}
                theme={theme}
              />
            </div>
            <div className="h-[150px] w-full border-t border-border">
              <div className="px-4 pt-2 text-xs font-semibold text-ink-dim">
                {sub === "rsi" ? `${t("controls.rsi")} (14)` : t("controls.volume")}
              </div>
              <div className="h-[120px] w-full">
                <SubChart candles={candles} kind={sub} theme={theme} />
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
        </section>

        {/* ===== Portfolio management ===== */}
        <div id="holdings" className="scroll-mt-20">
          <PortfolioOverview />
        </div>

        {/* ===== Analysis + News ===== */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PortfolioAnalysis />
          </div>
          <div id="news" className="scroll-mt-20 lg:col-span-1">
            <NewsFeed />
          </div>
        </div>

        <footer className="pt-2 text-center text-xs text-ink-dim">
          {t("footer.text", { n: stats.positions.length })}
        </footer>
      </main>
    </div>
  );
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function TopBar() {
  const { theme, toggleTheme, lang, setLang, t } = useUI();
  const navItems = [
    { id: "dashboard", label: t("nav.dashboard") },
    { id: "holdings", label: t("nav.holdings") },
    { id: "news", label: t("nav.news") },
  ];
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3">
        <button
          onClick={() => scrollTo("dashboard")}
          className="flex items-center gap-2"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-up/20 text-up">
            ◆
          </span>
          <span className="text-lg font-bold tracking-tight">{t("brand.title")}</span>
          <span className="ml-1 rounded bg-panel-2 px-1.5 py-0.5 text-[10px] font-semibold text-ink-dim">
            {t("badge.live")}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <nav className="hidden gap-1 text-sm sm:flex">
            {navItems.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className="rounded-md px-3 py-1.5 text-ink-dim transition-colors hover:bg-panel-2 hover:text-ink"
              >
                {n.label}
              </button>
            ))}
          </nav>

          {/* Language switch */}
          <div className="flex items-center rounded-lg border border-border bg-panel-2 p-0.5 text-xs">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={cn(
                  "rounded-md px-2 py-1 font-semibold transition-colors",
                  lang === l.code
                    ? "bg-accent-blue/20 text-accent-blue"
                    : "text-ink-dim hover:text-ink"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? t("settings.light") : t("settings.dark")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-panel-2 text-ink-dim transition-colors hover:text-ink"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </div>
    </header>
  );
}
