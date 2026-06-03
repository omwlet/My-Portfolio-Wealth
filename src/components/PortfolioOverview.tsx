import { usePortfolio } from "../context/PortfolioContext";
import { useUI } from "../context/UIContext";
import { fmtMoney, fmtPct, fmtSigned } from "../lib/calc";
import { AddShares } from "./AddShares";
import { Panel, cn } from "./ui";

export function PortfolioOverview() {
  const { stats, selectedSymbol, setSelectedSymbol, removeHolding, lastUpdated } =
    usePortfolio();
  const { t } = useUI();
  const { positions } = stats;

  return (
    <Panel
      title={t("holdings.title")}
      right={
        <span className="text-xs text-ink-dim">
          {lastUpdated
            ? t("holdings.updated", { time: lastUpdated.toLocaleTimeString() })
            : t("holdings.loading")}
        </span>
      }
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Holdings table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-ink-dim">
              <tr className="text-left">
                <th className="py-2 pr-2">{t("holdings.symbol")}</th>
                <th className="py-2 px-2 text-right">{t("holdings.shares")}</th>
                <th className="py-2 px-2 text-right">{t("holdings.avgCost")}</th>
                <th className="py-2 px-2 text-right">{t("holdings.price")}</th>
                <th className="py-2 px-2 text-right">{t("holdings.mktValue")}</th>
                <th className="py-2 px-2 text-right">{t("holdings.unrealized")}</th>
                <th className="py-2 px-2 text-right">{t("holdings.weight")}</th>
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
                    {t("holdings.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add form */}
        <div className="rounded-lg border border-border bg-panel-2/40 p-3">
          <h3 className="mb-2 text-sm font-semibold">{t("holdings.addTitle")}</h3>
          <AddShares />
        </div>
      </div>
    </Panel>
  );
}
