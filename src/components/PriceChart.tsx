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

export function PriceChart({
  candles,
  chartType,
  overlays,
  supports,
  resistances,
}: {
  candles: Candle[];
  chartType: ChartType;
  overlays: Overlays;
  supports: number[];
  resistances: number[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainRef = useRef<ISeriesApi<"Candlestick" | "Line"> | null>(null);
  const overlayRefs = useRef<ISeriesApi<"Line">[]>([]);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  // --- create chart once ---
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
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#4f9bff", width: 1, style: LineStyle.Dashed },
        horzLine: { color: "#4f9bff", width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: { borderColor: "#24262d" },
      timeScale: { borderColor: "#24262d", timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
      mainRef.current = null;
      overlayRefs.current = [];
      priceLinesRef.current = [];
    };
  }, []);

  // --- (re)build main series + overlays when type/data/overlays change ---
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !candles.length) return;

    // Clear previous main + overlay series.
    if (mainRef.current) {
      chart.removeSeries(mainRef.current);
      mainRef.current = null;
    }
    overlayRefs.current.forEach((s) => chart.removeSeries(s));
    overlayRefs.current = [];

    const data =
      chartType === "heikin" ? toHeikinAshi(candles) : candles;

    if (chartType === "line") {
      const line = chart.addLineSeries({
        color: "#00e08a",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      line.setData(
        data.map((c) => ({ time: c.time as UTCTimestamp, value: c.close }))
      );
      mainRef.current = line;
    } else {
      const candle = chart.addCandlestickSeries({
        upColor: "#16c784",
        downColor: "#ff4d6d",
        borderUpColor: "#16c784",
        borderDownColor: "#ff4d6d",
        wickUpColor: "#16c784",
        wickDownColor: "#ff4d6d",
        priceLineVisible: false,
      });
      candle.setData(
        data.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
      mainRef.current = candle;
    }

    // Bollinger Bands overlay.
    if (overlays.bollinger) {
      const { upper, lower, mid } = computeBollinger(candles);
      const mk = (
        color: string,
        style: LineStyle,
        pts: { time: number; value: number }[]
      ) => {
        const s = chart.addLineSeries({
          color,
          lineWidth: 1,
          lineStyle: style,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        s.setData(pts.map((p) => ({ time: p.time as UTCTimestamp, value: p.value })));
        overlayRefs.current.push(s);
      };
      mk("#ffcf3f", LineStyle.Solid, upper);
      mk("#ffcf3f", LineStyle.Dotted, mid);
      mk("#ffcf3f", LineStyle.Solid, lower);
    }

    // SMA 50 overlay.
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

    chart.timeScale().fitContent();
  }, [candles, chartType, overlays.bollinger, overlays.sma]);

  // --- support/resistance horizontal price lines ---
  useEffect(() => {
    const series = mainRef.current;
    if (!series) return;
    // Remove old lines.
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
  }, [supports, resistances, overlays.sr, chartType, candles]);

  return <div ref={containerRef} className="h-full w-full" />;
}
