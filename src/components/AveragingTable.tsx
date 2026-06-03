import { buildAveraging, fmtMoney, fmtNum } from "../lib/calc";
import { useUI } from "../context/UIContext";
import { cn } from "./ui";

export function AveragingTable({
  shares,
  avgCost,
  amount,
  supports,
}: {
  shares: number;
  avgCost: number;
  amount: number;
  supports: number[];
}) {
  const { t } = useUI();
  const rows = buildAveraging(shares, avgCost, amount, supports);

  return (
    <div className="rounded-lg border border-border bg-panel-2/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-accent-blue">{t("avg.title")}</h4>
        <span className="tnum text-[11px] text-ink-dim">
          {t("avg.current", { sh: fmtNum(shares, 4), avg: fmtMoney(avgCost) })}
        </span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-ink-dim">
            <th className="py-1 text-left">{t("avg.buyAt")}</th>
            <th className="py-1 text-right">{t("avg.addShares")}</th>
            <th className="py-1 text-right">{t("avg.newAvg")}</th>
            <th className="py-1 text-right">{t("avg.newShares")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              <td className="py-1.5 text-left">
                <span className="font-semibold text-accent-purple">S{i + 1}</span>
                <span className="tnum ml-1 text-ink-dim">{fmtNum(r.level)}</span>
              </td>
              <td className="tnum py-1.5 text-right">+{fmtNum(r.addShares, 4)}</td>
              <td
                className={cn(
                  "tnum py-1.5 text-right font-semibold",
                  r.averagingDown ? "text-up" : "text-down"
                )}
              >
                {fmtMoney(r.newAvg)}
              </td>
              <td className="tnum py-1.5 text-right text-ink-dim">
                {fmtNum(r.newShares, 4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-dim">
        {t("avg.help", { amt: fmtMoney(amount) })}
      </p>
    </div>
  );
}
