import { useState } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { useUI } from "../context/UIContext";
import { api } from "../lib/api";
import { cn } from "./ui";

export function AddShares() {
  const { addHolding } = usePortfolio();
  const { t } = useUI();
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState(""); // dollars invested
  const [price, setPrice] = useState(""); // buy price (avg cost)
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fillLivePrice = async () => {
    if (!symbol) return;
    setBusy(true);
    setMsg(null);
    try {
      const q = await api.quote(symbol.toUpperCase());
      setPrice(String(q.price));
      setMsg(`${q.symbol}: $${q.price}`);
    } catch {
      setMsg(t("add.errFetch"));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    const px = Number(price);
    if (!symbol.trim() || !(amt > 0) || !(px > 0)) {
      setMsg(t("add.errInputs"));
      return;
    }
    // Dollars invested -> fractional shares at the given price.
    const shares = +(amt / px).toFixed(6);
    addHolding({ symbol: symbol.toUpperCase().trim(), shares, avgCost: px });
    setMsg(
      t("add.added", {
        amt: amt.toFixed(2),
        sym: symbol.toUpperCase(),
        price: px.toFixed(2),
        sh: shares,
      })
    );
    setSymbol("");
    setAmount("");
    setPrice("");
  };

  // Live preview of how many shares the entered $ buys.
  const previewShares =
    Number(amount) > 0 && Number(price) > 0
      ? (Number(amount) / Number(price)).toFixed(4)
      : null;

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Input
          placeholder={t("add.ticker")}
          value={symbol}
          onChange={(v) => setSymbol(v.toUpperCase())}
          className="uppercase"
        />
        <Input
          placeholder={t("add.amount")}
          value={amount}
          onChange={setAmount}
          type="number"
        />
        <div className="relative">
          <Input placeholder={t("add.price")} value={price} onChange={setPrice} type="number" />
          <button
            type="button"
            onClick={fillLivePrice}
            disabled={!symbol || busy}
            title={t("add.useLive")}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded bg-panel px-1.5 py-0.5 text-[10px] text-ink-dim ring-1 ring-border hover:text-ink disabled:opacity-50"
          >
            {busy ? "…" : "$"}
          </button>
        </div>
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-up/15 py-2 text-sm font-semibold text-up ring-1 ring-up/30 transition hover:bg-up/25"
      >
        {t("add.button")}
      </button>
      {previewShares && !msg && (
        <p className="text-xs text-ink-dim">
          ≈ {previewShares} {t("add.shares").toLowerCase()}
        </p>
      )}
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
