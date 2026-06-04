import { useState } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { useUI } from "../context/UIContext";
import { fmtMoney, fmtPct, fmtSigned } from "../lib/calc";
import { AddShares } from "./AddShares";
import { Panel, cn } from "./ui";

export function PortfolioOverview() {
  const {
    stats,
    selectedSymbol,
    setSelectedSymbol,
    removeHolding,
    lastUpdated,
    cash,
    setCash,
    addCash,
  } = usePortfolio();
  const { t } = useUI();
  const { positions } = stats;
  const [cashInput, setCashInput] = useState("");

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
                <th className="py-2 px-2 text-right">{t("holdings.invested")}</th>
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
                    <td className="tnum px-2 text-right font-semibold">
                      {fmtMoney(p.costBasis)}
                    </td>
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
              {cash > 0 && (
                <tr className="border-t border-border bg-panel-2/30">
                  <td className="py-2 pr-2">
                    <div className="font-semibold text-accent-yellow">
                      {t("holdings.cash")}
                    </div>
                  </td>
                  <td className="px-2 text-right text-ink-dim">—</td>
                  <td className="px-2 text-right text-ink-dim">—</td>
                  <td className="tnum px-2 text-right font-semibold">{fmtMoney(cash)}</td>
                  <td className="px-2 text-right text-ink-dim">—</td>
                  <td className="tnum px-2 text-right font-semibold">{fmtMoney(cash)}</td>
                  <td className="px-2 text-right text-ink-dim">—</td>
                  <td className="tnum px-2 text-right text-ink-dim">
                    {stats.cashWeight.toFixed(1)}%
                  </td>
                  <td className="pl-2 text-right">
                    <button
                      onClick={() => setCash(0)}
                      className="rounded px-1.5 text-ink-dim hover:text-down"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )}
              {!positions.length && cash <= 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-ink-dim">
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

          {/* Cash balance */}
          <div className="mt-3 border-t border-border pt-3">
            <h3 className="mb-2 text-sm font-semibold text-accent-yellow">
              {t("cash.title")}
              {cash > 0 && (
                <span className="tnum ml-2 text-ink-dim">{fmtMoney(cash)}</span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-dim">
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  placeholder={t("cash.placeholder")}
                  className="tnum w-full rounded-lg border border-border bg-panel-2 py-2 pl-6 pr-2 text-sm outline-none placeholder:text-ink-dim/60 focus:ring-1 focus:ring-accent-blue"
                />
              </div>
              <button
                onClick={() => {
                  const n = Number(cashInput);
                  if (n >= 0) setCash(n);
                  setCashInput("");
                }}
                className="rounded-lg bg-panel-2 px-3 py-2 text-xs font-semibold text-ink ring-1 ring-border hover:bg-panel-2/70"
              >
                {t("cash.set")}
              </button>
              <button
                onClick={() => {
                  const n = Number(cashInput);
                  if (n) addCash(n);
                  setCashInput("");
                }}
                className="rounded-lg bg-up/15 px-3 py-2 text-xs font-semibold text-up ring-1 ring-up/30 hover:bg-up/25"
              >
                {t("cash.add")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
