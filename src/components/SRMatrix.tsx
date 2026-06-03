import { buildMatrix, fmtMoney, fmtNum } from "../lib/calc";
import { useUI } from "../context/UIContext";
import { cn } from "./ui";

export function SRMatrix({
  investment,
  supports,
  resistances,
}: {
  investment: number;
  supports: number[];
  resistances: number[];
}) {
  const { t } = useUI();
  const matrix = buildMatrix(investment, supports, resistances);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-panel px-2 py-2 text-left text-ink-dim">
              {t("calc.entryTarget")}
            </th>
            {resistances.map((r, i) => (
              <th key={i} className="px-2 py-2 text-right">
                <div className="font-semibold text-accent-pink">R{i + 1}</div>
                <div className="tnum text-ink-dim">{fmtNum(r)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {supports.map((s, ri) => (
            <tr key={ri} className="border-t border-border">
              <th className="sticky left-0 z-10 bg-panel px-2 py-2 text-left">
                <div className="font-semibold text-accent-purple">S{ri + 1}</div>
                <div className="tnum text-ink-dim">{fmtNum(s)}</div>
              </th>
              {matrix[ri].map((cell, ci) => {
                const positive = cell.profit >= 0;
                return (
                  <td
                    key={ci}
                    className={cn(
                      "px-2 py-2 text-right align-top tnum",
                      positive ? "text-up" : "text-down"
                    )}
                    title={`Buy @ ${fmtMoney(cell.support)} → Sell @ ${fmtMoney(
                      cell.resistance
                    )} · ${cell.shares.toFixed(3)} sh`}
                  >
                    <div className="font-semibold">
                      {positive ? "+" : "-"}
                      {fmtMoney(Math.abs(cell.profit))}
                    </div>
                    <div className="opacity-80">
                      ({positive ? "+" : ""}
                      {cell.profitPct.toFixed(2)}%)
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
