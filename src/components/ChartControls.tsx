import { useUI } from "../context/UIContext";
import { cn } from "./ui";

export type ChartType = "candles" | "heikin" | "line";

export interface Overlays {
  sr: boolean;
  bollinger: boolean;
  sma: boolean;
}

const RANGES = ["1D", "5D", "1M", "6M", "YTD", "1Y"];

export function ChartControls({
  range,
  setRange,
  chartType,
  setChartType,
  overlays,
  setOverlays,
  sub,
  setSub,
}: {
  range: string;
  setRange: (r: string) => void;
  chartType: ChartType;
  setChartType: (t: ChartType) => void;
  overlays: Overlays;
  setOverlays: (o: Overlays) => void;
  sub: "rsi" | "volume";
  setSub: (s: "rsi" | "volume") => void;
}) {
  const { t } = useUI();
  const SUBS = [
    { key: "rsi", label: t("controls.rsi") },
    { key: "volume", label: t("controls.volume") },
  ] as const;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border px-5 py-2.5 text-xs">
      {/* Ranges */}
      <div className="flex items-center gap-1">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "rounded-md px-2.5 py-1 font-semibold transition-colors",
              range === r
                ? "bg-accent-blue/20 text-accent-blue"
                : "text-ink-dim hover:bg-panel-2 hover:text-ink"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <Divider />

      {/* Chart type */}
      <div className="flex items-center gap-1">
        <TypeBtn active={chartType === "candles"} onClick={() => setChartType("candles")}>
          {t("controls.candles")}
        </TypeBtn>
        <TypeBtn active={chartType === "heikin"} onClick={() => setChartType("heikin")}>
          {t("controls.heikin")}
        </TypeBtn>
        <TypeBtn active={chartType === "line"} onClick={() => setChartType("line")}>
          {t("controls.line")}
        </TypeBtn>
      </div>

      <Divider />

      {/* Overlays */}
      <div className="flex items-center gap-2">
        <Toggle
          label={t("controls.srLines")}
          color="text-accent-purple"
          on={overlays.sr}
          onClick={() => setOverlays({ ...overlays, sr: !overlays.sr })}
        />
        <Toggle
          label={t("controls.bollinger")}
          color="text-accent-yellow"
          on={overlays.bollinger}
          onClick={() => setOverlays({ ...overlays, bollinger: !overlays.bollinger })}
        />
        <Toggle
          label={t("controls.sma")}
          color="text-accent-blue"
          on={overlays.sma}
          onClick={() => setOverlays({ ...overlays, sma: !overlays.sma })}
        />
      </div>

      <Divider />

      {/* Sub-chart selector */}
      <div className="flex items-center gap-1">
        <span className="text-ink-dim">{t("controls.sub")}:</span>
        {SUBS.map((s) => (
          <TypeBtn key={s.key} active={sub === s.key} onClick={() => setSub(s.key)}>
            {s.label}
          </TypeBtn>
        ))}
      </div>
    </div>
  );
}

function Divider() {
  return <span className="h-4 w-px bg-border" />;
}

function TypeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 font-medium transition-colors",
        active
          ? "bg-panel-2 text-ink ring-1 ring-border"
          : "text-ink-dim hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  on,
  onClick,
  color,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 font-medium transition-colors",
        on ? "bg-panel-2 ring-1 ring-border" : "opacity-60 hover:opacity-100"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          on ? color.replace("text-", "bg-") : "bg-ink-dim/40"
        )}
      />
      <span className={on ? color : "text-ink-dim"}>{label}</span>
    </button>
  );
}
