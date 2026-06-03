import { useState } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { api } from "../lib/api";
import { cn } from "./ui";

export function AddShares() {
  const { addHolding } = usePortfolio();
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fillLivePrice = async () => {
    if (!symbol) return;
    setBusy(true);
    setMsg(null);
    try {
      const q = await api.quote(symbol.toUpperCase());
      setAvgCost(String(q.price));
      setMsg(`Live ${q.symbol}: $${q.price}`);
    } catch {
      setMsg("Could not fetch price — check the ticker.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const sh = Number(shares);
    const ac = Number(avgCost);
    if (!symbol.trim() || !(sh > 0) || !(ac > 0)) {
      setMsg("Enter a ticker, positive shares and a cost.");
      return;
    }
    addHolding({ symbol: symbol.toUpperCase().trim(), shares: sh, avgCost: ac });
    setMsg(`Added ${sh} ${symbol.toUpperCase()} @ $${ac}`);
    setSymbol("");
    setShares("");
    setAvgCost("");
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Input
          placeholder="Ticker"
          value={symbol}
          onChange={(v) => setSymbol(v.toUpperCase())}
          className="uppercase"
        />
        <Input placeholder="Shares" value={shares} onChange={setShares} type="number" />
        <Input placeholder="Avg cost" value={avgCost} onChange={setAvgCost} type="number" />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-up/15 py-2 text-sm font-semibold text-up ring-1 ring-up/30 transition hover:bg-up/25"
        >
          + Add / Merge position
        </button>
        <button
          type="button"
          onClick={fillLivePrice}
          disabled={!symbol || busy}
          className="rounded-lg bg-panel-2 px-3 py-2 text-xs text-ink-dim ring-1 ring-border transition hover:text-ink disabled:opacity-50"
        >
          {busy ? "…" : "Use live $"}
        </button>
      </div>
      {msg && <p className="text-xs text-ink-dim">{msg}</p>}
    </form>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      step="any"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "tnum w-full rounded-lg border border-border bg-panel-2 px-2.5 py-2 text-sm outline-none placeholder:text-ink-dim/60 focus:ring-1 focus:ring-accent-blue",
        className
      )}
    />
  );
}
