import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  LineStyle,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type UTCTimestamp,
} from "lightweight-charts";
import { computeBollinger, computeSMA, toHeikinAshi } from "../lib/calc";
import type { Candle } from "../types";
import type { ChartType, Overlays } from "./ChartControls";

const SUPPORT_COLORS = ["#a974ff", "#4f9bff", "#16c784"]; // purple, blue, green
const RESISTANCE_COLORS = ["#ff4fa3", "#ff4d6d", "#ffcf3f", "#ff8a3f"]; // pinks/yellow

export function chartTheme(theme: "dark" | "light") {
  return theme === "light"
    ? { bg: "#ffffff", text: "#5b6473", grid: "rgba(0,0,0,0.06)", border: "#dfe3ea" }
    : { bg: "#121212", text: "#8b8f9a", grid: "rgba(255,255,255,0.05)", border: "#24262d" };
}

export function PriceChart({
  candles,
  chartType,
  overlays,
  supports,
  resistances,
  theme,
  viewKey,
}: {
  candles: Candle[];
  chartType: ChartType;
  overlays: Overlays;
  supports: number[];
  resistances: number[];
  theme: "dark" | "light";
  /** changes when symbol/range/type change — gates auto-fit so live polls don't reset zoom */
  viewKey: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainRef = useRef<ISeriesApi<"Candlestick" | "Line"> | null>(null);
  const overlayRefs = useRef<ISeriesApi<"Line">[]>([]);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const lastTypeRef = useRef<ChartType | null>(null);
  const lastViewKeyRef = useRef<string>("");

  // --- create chart once ---
  useEffect(() => {
    if (!containerRef.current) return;
    const c = chartTheme(theme);
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: c.bg },
        textColor: c.text,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      },
      grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#4f9bff", width: 1, style: LineStyle.Dashed },
        horzLine: { color: "#4f9bff", width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: { borderColor: c.border },
      timeScale: { borderColor: c.border, timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    chartRef.current = chart;
    return () => {
      chart.remove();
      chartRef.current = null;
      mainRef.current = null;
      overlayRefs.current = [];
      priceLinesRef.current = [];
      lastTypeRef.current = null;
    };
  }, []);

  // --- re-theme on light/dark toggle ---
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const c = chartTheme(theme);
    chart.applyOptions({
      layout: { background: { type: ColorType.Solid, color: c.bg }, textColor: c.text },
      grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
      rightPriceScale: { borderColor: c.border },
      timeScale: { borderColor: c.border },
    });
  }, [theme]);

  // --- update data + overlays. Recreate the main series only when the chart
  //     TYPE changes; otherwise reuse it (so live polls update in place). ---
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !candles.length) return;

    const data = chartType === "heikin" ? toHeikinAshi(candles) : candles;

    // (Re)create the main series only if the type changed.
    if (!mainRef.current || lastTypeRef.current !== chartType) {
      if (mainRef.current) chart.removeSeries(mainRef.current);
      mainRef.current =
        chartType === "line"
          ? chart.addLineSeries({
              color: "#00e08a",
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: true,
            })
          : chart.addCandlestickSeries({
              upColor: "#16c784",
              downColor: "#ff4d6d",
              borderUpColor: "#16c784",
              borderDownColor: "#ff4d6d",
              wickUpColor: "#16c784",
              wickDownColor: "#ff4d6d",
              priceLineVisible: false,
            });
      lastTypeRef.current = chartType;
    }

    if (chartType === "line") {
      (mainRef.current as ISeriesApi<"Line">).setData(
        data.map((c) => ({ time: c.time as UTCTimestamp, value: c.close }))
      );
    } else {
      (mainRef.current as ISeriesApi<"Candlestick">).setData(
        data.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
    }

    // Rebuild overlays.
    overlayRefs.current.forEach((s) => chart.removeSeries(s));
    overlayRefs.current = [];
    if (overlays.bollinger) {
      const { upper, lower, mid } = computeBollinger(candles);
      const mk = (style: LineStyle, pts: { time: number; value: number }[]) => {
        const s = chart.addLineSeries({
          color: "#ffcf3f",
          lineWidth: 1,
          lineStyle: style,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        s.setData(pts.map((p) => ({ time: p.time as UTCTimestamp, value: p.value })));
        overlayRefs.current.push(s);
      };
      mk(LineStyle.Solid, upper);
      mk(LineStyle.Dotted, mid);
      mk(LineStyle.Solid, lower);
    }
    if (overlays.sma) {
      const sma = computeSMA(candles, 50);
      const s = chart.addLineSeries({
        color: "#4f9bff",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      s.setData(sma.map((p) => ({ time: p.time as UTCTimestamp, value: p.value })));
      overlayRefs.current.push(s);
    }

    // Only auto-fit when the view actually changes (not on every live poll).
    if (lastViewKeyRef.current !== viewKey) {
      chart.timeScale().fitContent();
      lastViewKeyRef.current = viewKey;
    }
  }, [candles, chartType, overlays.bollinger, overlays.sma, viewKey]);

  // --- support/resistance horizontal price lines ---
  useEffect(() => {
    const series = mainRef.current;
    if (!series) return;
    priceLinesRef.current.forEach((l) => series.removePriceLine(l));
    priceLinesRef.current = [];
    if (!overlays.sr) return;

    supports.forEach((price, i) => {
      priceLinesRef.current.push(
        series.createPriceLine({
          price,
          color: SUPPORT_COLORS[i % SUPPORT_COLORS.length],
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `S${i + 1}`,
        })
      );
    });
    resistances.forEach((price, i) => {
      priceLinesRef.current.push(
        series.createPriceLine({
          price,
          color: RESISTANCE_COLORS[i % RESISTANCE_COLORS.length],
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `R${i + 1}`,
        })
      );
    });
  }, [supports, resistances, overlays.sr, chartType, viewKey]);

  return <div ref={containerRef} className="h-full w-full" />;
}
