import { useEffect, useState } from "react";
import { api, RANGE_PRESETS } from "../lib/api";
import type { ChartPayload } from "../types";

// How often to refresh the chart, by timeframe (ms). Intraday refreshes fast.
function pollInterval(rangeKey: string): number {
  if (["1m", "5m", "15m"].includes(rangeKey)) return 20_000;
  if (["4H", "1D", "5D"].includes(rangeKey)) return 30_000;
  return 60_000;
}

export function useAssetData(symbol: string, rangeKey: string) {
  const [chart, setChart] = useState<ChartPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const preset = RANGE_PRESETS[rangeKey] ?? RANGE_PRESETS["6M"];

    const load = (initial: boolean) => {
      if (initial) setLoading(true);
      api
        .chart(symbol, preset.range, preset.interval)
        .then((data) => {
          if (cancelled) return;
          setChart(data);
          setError(null);
        })
        .catch((e) => {
          if (!cancelled && initial) setError(String(e?.message ?? e));
        })
        .finally(() => {
          if (!cancelled && initial) setLoading(false);
        });
    };

    load(true); // initial load (shows spinner)
    const timer = window.setInterval(() => load(false), pollInterval(rangeKey));

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [symbol, rangeKey]);

  return { chart, loading, error };
}
