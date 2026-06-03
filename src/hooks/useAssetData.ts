import { useEffect, useState } from "react";
import { api, RANGE_PRESETS } from "../lib/api";
import type { ChartPayload } from "../types";

export function useAssetData(symbol: string, rangeKey: string) {
  const [chart, setChart] = useState<ChartPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const preset = RANGE_PRESETS[rangeKey] ?? RANGE_PRESETS["6M"];
    setLoading(true);
    setError(null);
    api
      .chart(symbol, preset.range, preset.interval)
      .then((data) => {
        if (!cancelled) setChart(data);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e?.message ?? e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, rangeKey]);

  return { chart, loading, error };
}
