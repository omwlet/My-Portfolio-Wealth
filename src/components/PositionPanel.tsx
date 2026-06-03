import { fmtMoney } from "../lib/calc";
import { useUI } from "../context/UIContext";
import { useCurrency } from "../context/CurrencyContext";
import { Panel, cn } from "./ui";
import { SRMatrix } from "./SRMatrix";
import { AveragingTable } from "./AveragingTable";

export function PositionPanel({
  symbol,
  currentPrice,
  investment,
  setInvestment,
  locked,
  setLocked,
  useCurrentPrice,
  setUseCurrentPrice,
  supports,
  resistances,
  setSupport,
  setResistance,
  onReset,
  heldShares,
  heldAvgCost,
}: {
  symbol: string;
  currentPrice: number;
  investment: number;
  setInvestment: (n: number) => void;
  locked: boolean;
  setLocked: (b: boolean) => void;
  useCurrentPrice: boolean;
  setUseCurrentPrice: (b: boolean) => void;
  supports: number[];
  resistances: number[];
  setSupport: (i: number, v: number) => void;
  setResistance: (i: number, v: number) => void;
  onReset: () => void;
  heldShares: number;
  heldAvgCost: number;
}) {
  const { t } = useUI();
  const { currency, rate, money, toUsd } = useCurrency();
  // The investment is stored in USD; show/edit it in the selected currency.
  const investDisplay = +(investment * rate).toFixed(currency.digits);
  return (
    <Panel
      title={
        <span>
          {t("calc.title")}
          <span className="ml-2 text-ink-dim">· {t("calc.subtitle", { sym: symbol })}</span>
        </span>
      }
      right={
        <button
          onClick={onReset}
          className="rounded-md px-2 py-1 text-xs text-ink-dim hover:bg-panel-2 hover:text-ink"
        >
          {t("calc.reset")}
        </button>
      }
    >
      <div className="space-y-4 p-4">
        {/* Investment amount */}
        <div>
          <label className="mb-1 block text-xs text-ink-dim">{t("calc.investment")}</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim">
                {currency.symbol}
              </span>
              <input
                type="number"
                value={investDisplay}
                disabled={locked}
                min={0}
                step={50}
                onChange={(e) => setInvestment(toUsd(Number(e.target.value)))}
                className={cn(
                  "tnum w-full rounded-lg border border-border bg-panel-2 py-2 pl-7 pr-3 text-right text-base font-semibold outline-none focus:ring-1 focus:ring-accent-blue",
                  locked && "opacity-60"
                )}
              />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs">
            <Check label={t("calc.lock")} checked={locked} onChange={setLocked} />
            <Check
              label={t("calc.useCurrent")}
              checked={useCurrentPrice}
              onChange={setUseCurrentPrice}
            />
          </div>
          {useCurrentPrice && (
            <p className="mt-1 text-xs text-accent-yellow">
              {t("calc.entryOverride", { price: fmtMoney(currentPrice) })}
            </p>
          )}
        </div>

        {/* Editable S / R baselines */}
        <div className="grid grid-cols-2 gap-4">
          <LevelEditor
            title={t("calc.supports")}
            color="text-accent-purple"
            prefix="S"
            values={supports}
            onChange={setSupport}
          />
          <LevelEditor
            title={t("calc.resistances")}
            color="text-accent-pink"
            prefix="R"
            values={resistances}
            onChange={setResistance}
          />
        </div>

        {/* Profit matrix */}
        <div className="rounded-lg border border-border bg-panel-2/40 p-1">
          <SRMatrix
            investment={investment}
            supports={supports}
            resistances={resistances}
          />
        </div>
        <p className="text-[11px] leading-relaxed text-ink-dim">
          {t("calc.help", { amt: money(investment) })}
        </p>

        {/* Average-down helper — only when this ticker is a held position */}
        {heldShares > 0 ? (
          <AveragingTable
            shares={heldShares}
            avgCost={heldAvgCost}
            amount={investment}
            supports={supports}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-ink-dim">
            {t("avg.none")}
          </p>
        )}
      </div>
    </Panel>
  );
}

function LevelEditor({
  title,
  prefix,
  color,
  values,
  onChange,
}: {
  title: string;
  prefix: string;
  color: string;
  values: number[];
  onChange: (i: number, v: number) => void;
}) {
  return (
    <div>
      <div className={cn("mb-1 text-xs font-semibold", color)}>{title}</div>
      <div className="space-y-1.5">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={cn("w-6 text-xs font-semibold", color)}>
              {prefix}
              {i + 1}
            </span>
            <input
              type="number"
              value={v}
              step={0.01}
              onChange={(e) => onChange(i, Number(e.target.value))}
              className="tnum w-full rounded-md border border-border bg-panel-2 px-2 py-1 text-right text-xs outline-none focus:ring-1 focus:ring-accent-blue"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-ink-dim hover:text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-accent-blue"
      />
      {label}
    </label>
  );
}
