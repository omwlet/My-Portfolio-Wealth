import { fmtMoney } from "../lib/calc";
import { useUI } from "../context/UIContext";
import type { Quote } from "../types";
import { cn } from "./ui";

export function AssetHeader({ quote, symbol }: { quote?: Quote; symbol: string }) {
  const { t } = useUI();
  const up = (quote?.change ?? 0) >= 0;
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{symbol}</h1>
          <span className="rounded-md bg-panel-2 px-2 py-0.5 text-xs text-ink-dim">
            {quote?.exchange || "—"}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-dim">{quote?.name ?? t("header.loading")}</p>
      </div>

      <div className="text-right">
        <div className="tnum text-4xl font-bold leading-none">
          {quote ? fmtMoney(quote.price) : "—"}
        </div>
        <div
          className={cn(
            "tnum mt-1 text-sm font-semibold",
            up ? "text-up" : "text-down"
          )}
        >
          {quote
            ? `${up ? "+" : "-"}${fmtMoney(Math.abs(quote.change))} (${
                up ? "+" : ""
              }${quote.changePct.toFixed(2)}%)`
            : "—"}
          <span className="ml-1 text-ink-dim">{t("header.today")}</span>
        </div>
      </div>

      <dl className="flex w-full gap-6 border-t border-border pt-3 text-xs sm:w-auto sm:border-t-0 sm:pt-0">
        <Field label={t("header.prevClose")} value={quote ? fmtMoney(quote.previousClose) : "—"} />
        <Field label={t("header.high52")} value={quote?.high52 ? fmtMoney(quote.high52) : "—"} />
        <Field label={t("header.low52")} value={quote?.low52 ? fmtMoney(quote.low52) : "—"} />
        <Field
          label={t("header.rangePos")}
          value={
            quote?.high52 && quote?.low52
              ? `${(
                  ((quote.price - quote.low52) / (quote.high52 - quote.low52)) *
                  100
                ).toFixed(0)}%`
              : "—"
          }
        />
      </dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-dim">{label}</dt>
      <dd className="tnum mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  );
}
