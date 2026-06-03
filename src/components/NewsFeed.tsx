import { useEffect, useState } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { useUI } from "../context/UIContext";
import { api } from "../lib/api";
import type { NewsItem } from "../types";
import { Panel, Spinner, cn } from "./ui";

export function NewsFeed() {
  const { selectedSymbol, holdings } = usePortfolio();
  const { t } = useUI();
  const [scope, setScope] = useState<"selected" | "portfolio">("selected");
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function run() {
      try {
        if (scope === "selected") {
          const { items } = await api.news(selectedSymbol, 12);
          if (!cancelled) setItems(items);
        } else {
          // Portfolio scope: pull a few per holding and merge by recency.
          const syms = Array.from(new Set(holdings.map((h) => h.symbol))).slice(0, 6);
          const lists = await Promise.all(
            syms.map((s) =>
              api.news(s, 4).then((r) => r.items).catch(() => [] as NewsItem[])
            )
          );
          const merged = dedupe(lists.flat()).sort(
            (a, b) => +new Date(b.published) - +new Date(a.published)
          );
          if (!cancelled) setItems(merged.slice(0, 16));
        }
      } catch (e) {
        if (!cancelled) setError(String((e as Error)?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [scope, selectedSymbol, holdings]);

  return (
    <Panel
      title={t("news.title")}
      right={
        <div className="flex items-center gap-1 text-xs">
          <ScopeBtn active={scope === "selected"} onClick={() => setScope("selected")}>
            {selectedSymbol}
          </ScopeBtn>
          <ScopeBtn active={scope === "portfolio"} onClick={() => setScope("portfolio")}>
            {t("news.portfolio")}
          </ScopeBtn>
        </div>
      }
    >
      <div className="max-h-[460px] space-y-1 overflow-y-auto p-2">
        {loading && (
          <div className="p-4">
            <Spinner label={t("news.loading")} />
          </div>
        )}
        {error && !loading && (
          <p className="p-4 text-sm text-down">{t("news.error", { err: error })}</p>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="p-4 text-sm text-ink-dim">{t("news.empty")}</p>
        )}
        {items.map((n, i) => (
          <a
            key={n.link + i}
            href={n.link}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-panel-2"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium leading-snug text-ink">{n.title}</span>
              {n.symbol && (
                <span className="shrink-0 rounded bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent-blue">
                  {n.symbol}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-ink-dim">
              <span>{n.publisher}</span>
              <span>·</span>
              <span>{timeAgo(n.published)}</span>
            </div>
          </a>
        ))}
      </div>
    </Panel>
  );
}

function ScopeBtn({
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
        "rounded-md px-2 py-1 font-semibold transition-colors",
        active ? "bg-accent-blue/20 text-accent-blue" : "text-ink-dim hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((n) => {
    const key = n.link || n.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - +new Date(iso);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
