import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  LineStyle,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { computeRSI } from "../lib/calc";
import type { Candle } from "../types";

export function SubChart({
  candles,
  kind,
}: {
  candles: Candle[];
  kind: "rsi" | "volume";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#121212" },
        textColor: "#8b8f9a",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: { borderColor: "#24262d" },
      timeScale: { borderColor: "#24262d", timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    chartRef.current = chart;
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !candles.length) return;

    // Rebuild: simplest is to recreate the chart's single series each time.
    // lightweight-charts has no "removeAllSeries", so we track via a fresh series.
    const created: ReturnType<IChartApi["addLineSeries"]>[] = [];

    if (kind === "rsi") {
      const rsi = computeRSI(candles);
      const line = chart.addLineSeries({
        color: "#a974ff",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      line.setData(rsi.map((p) => ({ time: p.time as UTCTimestamp, value: p.value })));
      // Overbought / oversold guides.
      line.createPriceLine({
        price: 70,
        color: "#ff4d6d",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "70",
      });
      line.createPriceLine({
        price: 30,
        color: "#16c784",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "30",
      });
      created.push(line);
    } else {
      const hist = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceLineVisible: false,
      });
      hist.setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume,
          color: c.close >= c.open ? "rgba(22,199,132,0.6)" : "rgba(255,77,109,0.6)",
        }))
      );
      // @ts-expect-error histogram is a valid series to track for cleanup
      created.push(hist);
    }

    chart.timeScale().fitContent();
    return () => {
      created.forEach((s) => chart.removeSeries(s));
    };
  }, [candles, kind]);

  return <div ref={containerRef} className="h-full w-full" />;
}
