import { usePortfolio } from "../context/PortfolioContext";
import { fmtMoney, fmtPct, fmtSigned } from "../lib/calc";
import { Panel, cn } from "./ui";

const ALLOC_COLORS = [
  "#a974ff",
  "#4f9bff",
  "#16c784",
  "#ffcf3f",
  "#ff4fa3",
  "#ff8a3f",
  "#00e08a",
];

export function PortfolioAnalysis() {
  const { stats } = usePortfolio();
  const { positions } = stats;

  // --- simple portfolio "health" heuristic (0-100) ---
  const diversityScore = Math.max(0, 100 - stats.concentration); // lower concentration = better
  const returnScore = clamp(50 + stats.unrealizedPct * 2, 0, 100);
  const momentumScore = clamp(50 + stats.dayChangePct * 5, 0, 100);
  const health = Math.round(
    diversityScore * 0.35 + returnScore * 0.45 + momentumScore * 0.2
  );
  const grade =
    health >= 75 ? "Healthy" : health >= 55 ? "Balanced" : health >= 40 ? "Watch" : "At Risk";
  const gradeColor =
    health >= 75 ? "text-up" : health >= 55 ? "text-accent-blue" : health >= 40 ? "text-accent-yellow" : "text-down";

  const sorted = [...positions].sort((a, b) => b.weight - a.weight);

  return (
    <Panel title="Portfolio Health & Analysis">
      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr_1.3fr]">
        {/* KPIs */}
        <div className="space-y-3">
          <Kpi label="Total Market Value" value={fmtMoney(stats.marketValue)} />
          <Kpi label="Total Cost Basis" value={fmtMoney(stats.costBasis)} />
          <Kpi
            label="Unrealized P/L"
            value={fmtSigned(stats.unrealized)}
            sub={fmtPct(stats.unrealizedPct)}
            tone={stats.unrealized >= 0 ? "up" : "down"}
          />
          <Kpi
            label="Today"
            value={fmtSigned(stats.dayChange)}
            sub={fmtPct(stats.dayChangePct)}
            tone={stats.dayChange >= 0 ? "up" : "down"}
          />
        </div>

        {/* Health score + insights */}
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-panel-2/40 p-4 text-center">
            <div className="text-xs text-ink-dim">Health Score</div>
            <div className={cn("tnum mt-1 text-4xl font-bold", gradeColor)}>{health}</div>
            <div className={cn("text-sm font-semibold", gradeColor)}>{grade}</div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-panel">
              <div
                className={cn(
                  "h-full rounded-full",
                  health >= 75 ? "bg-up" : health >= 55 ? "bg-accent-blue" : health >= 40 ? "bg-accent-yellow" : "bg-down"
                )}
                style={{ width: `${health}%` }}
              />
            </div>
          </div>
          {stats.best && stats.worst && (
            <div className="space-y-1.5 text-xs">
              <Insight
                label="Top performer"
                text={`${stats.best.symbol} ${fmtPct(stats.best.unrealizedPct)}`}
                tone="up"
              />
              <Insight
                label="Laggard"
                text={`${stats.worst.symbol} ${fmtPct(stats.worst.unrealizedPct)}`}
                tone="down"
              />
              <Insight
                label="Concentration"
                text={`Largest position ${stats.concentration.toFixed(1)}%${
                  stats.concentration > 40 ? " — consider trimming" : ""
                }`}
                tone={stats.concentration > 40 ? "warn" : "neutral"}
              />
            </div>
          )}
        </div>

        {/* Allocation */}
        <div>
          <div className="mb-2 text-xs text-ink-dim">Allocation by market value</div>
          <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full bg-panel-2">
            {sorted.map((p, i) => (
              <div
                key={p.id}
                title={`${p.symbol} ${p.weight.toFixed(1)}%`}
                style={{
                  width: `${p.weight}%`,
                  background: ALLOC_COLORS[i % ALLOC_COLORS.length],
                }}
              />
            ))}
          </div>
          <div className="space-y-1.5">
            {sorted.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: ALLOC_COLORS[i % ALLOC_COLORS.length] }}
                />
                <span className="w-14 font-semibold">{p.symbol}</span>
                <span className="tnum flex-1 text-ink-dim">{fmtMoney(p.marketValue)}</span>
                <span className="tnum w-12 text-right">{p.weight.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="rounded-lg border border-border bg-panel-2/40 p-3">
      <div className="text-xs text-ink-dim">{label}</div>
      <div
        className={cn(
          "tnum mt-1 text-lg font-bold",
          tone === "up" && "text-up",
          tone === "down" && "text-down"
        )}
      >
        {value}
        {sub && <span className="ml-1 text-xs font-semibold">{sub}</span>}
      </div>
    </div>
  );
}

function Insight({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: "up" | "down" | "warn" | "neutral";
}) {
  const color =
    tone === "up"
      ? "text-up"
      : tone === "down"
      ? "text-down"
      : tone === "warn"
      ? "text-accent-yellow"
      : "text-ink";
  return (
    <div className="flex items-center justify-between rounded-md bg-panel-2/40 px-2.5 py-1.5">
      <span className="text-ink-dim">{label}</span>
      <span className={cn("font-semibold", color)}>{text}</span>
    </div>
  );
}
