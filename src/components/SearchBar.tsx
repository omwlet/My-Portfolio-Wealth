import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useUI } from "../context/UIContext";
import type { SearchResult } from "../types";
import { cn } from "./ui";

const TYPE_LABEL: Record<string, string> = {
  EQUITY: "Stock",
  ETF: "ETF",
  INDEX: "Index",
  CRYPTOCURRENCY: "Crypto",
  CURRENCY: "FX",
  MUTUALFUND: "Fund",
  FUTURE: "Future",
};

export function SearchBar({ onSelect }: { onSelect: (symbol: string) => void }) {
  const { t } = useUI();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced fetch of suggestions.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    const id = window.setTimeout(() => {
      api
        .search(q)
        .then((r) => {
          setResults(r.results.slice(0, 8));
          setActive(0);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 220);
    return () => window.clearTimeout(id);
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const choose = (sym: string) => {
    onSelect(sym.toUpperCase());
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !results.length) {
      if (e.key === "Enter" && query.trim()) choose(query.trim());
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active]?.symbol ?? query.trim());
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative hidden md:block">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-dim">
        ⌕
      </span>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t("search.placeholder")}
        className="w-44 rounded-lg border border-border bg-panel-2 py-1.5 pl-7 pr-2 text-sm outline-none placeholder:text-ink-dim/70 focus:w-64 focus:ring-1 focus:ring-accent-blue"
      />

      {open && (results.length > 0 || loading) && (
        <div className="absolute right-0 z-30 mt-1 w-72 overflow-hidden rounded-lg border border-border bg-panel shadow-xl">
          {loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-ink-dim">{t("search.searching")}</div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.symbol}-${i}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(r.symbol)}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-3 py-2 text-left",
                i === active ? "bg-panel-2" : "hover:bg-panel-2/60"
              )}
            >
              <span className="min-w-0">
                <span className="font-semibold">{r.symbol}</span>
                <span className="ml-2 truncate text-xs text-ink-dim">{r.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="rounded bg-panel-2 px-1.5 py-0.5 text-[10px] text-ink-dim ring-1 ring-border">
                  {TYPE_LABEL[r.type] ?? r.type}
                </span>
                <span className="text-[10px] text-ink-dim">{r.exchange}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
