import { usePortfolio } from "../context/PortfolioContext";
import { fmtMoney, fmtPct, fmtSigned } from "../lib/calc";
import { AddShares } from "./AddShares";
import { Panel, cn } from "./ui";

export function PortfolioOverview() {
  const { stats, selectedSymbol, setSelectedSymbol, removeHolding, lastUpdated } =
    usePortfolio();
  const { positions } = stats;

  return (
    <Panel
      title="Portfolio Holdings"
      right={
        <span className="text-xs text-ink-dim">
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Loading…"}
        </span>
      }
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Holdings table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-ink-dim">
              <tr className="text-left">
                <th className="py-2 pr-2">Symbol</th>
                <th className="py-2 px-2 text-right">Shares</th>
                <th className="py-2 px-2 text-right">Avg Cost</th>
                <th className="py-2 px-2 text-right">Price</th>
                <th className="py-2 px-2 text-right">Mkt Value</th>
                <th className="py-2 px-2 text-right">Unrealized P/L</th>
                <th className="py-2 px-2 text-right">Weight</th>
                <th className="py-2 pl-2"></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const up = p.unrealized >= 0;
                const selected = p.symbol === selectedSymbol;
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedSymbol(p.symbol)}
                    className={cn(
                      "cursor-pointer border-t border-border transition-colors hover:bg-panel-2/60",
                      selected && "bg-accent-blue/10"
                    )}
                  >
                    <td className="py-2 pr-2">
                      <div className="font-semibold">{p.symbol}</div>
                      <div className="max-w-[140px] truncate text-xs text-ink-dim">
                        {p.quote?.name ?? ""}
                      </div>
                    </td>
                    <td className="tnum px-2 text-right">{p.shares}</td>
                    <td className="tnum px-2 text-right">{fmtMoney(p.avgCost)}</td>
                    <td className="tnum px-2 text-right">
                      {p.quote ? fmtMoney(p.quote.price) : "—"}
                    </td>
                    <td className="tnum px-2 text-right">{fmtMoney(p.marketValue)}</td>
                    <td
                      className={cn(
                        "tnum px-2 text-right font-semibold",
                        up ? "text-up" : "text-down"
                      )}
                    >
                      {fmtSigned(p.unrealized)}
                      <div className="text-xs font-normal opacity-80">
                        {fmtPct(p.unrealizedPct)}
                      </div>
                    </td>
                    <td className="tnum px-2 text-right text-ink-dim">
                      {p.weight.toFixed(1)}%
                    </td>
                    <td className="pl-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHolding(p.id);
                        }}
                        className="rounded px-1.5 text-ink-dim hover:text-down"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!positions.length && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-ink-dim">
                    No positions yet — add one on the right.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add form */}
        <div className="rounded-lg border border-border bg-panel-2/40 p-3">
          <h3 className="mb-2 text-sm font-semibold">Add shares</h3>
          <AddShares />
        </div>
      </div>
    </Panel>
  );
}
