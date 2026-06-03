import type { ReactNode } from "react";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Panel({
  children,
  className,
  title,
  right,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-panel/80 backdrop-blur-sm",
        className
      )}
    >
      {(title || right) && (
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold tracking-wide text-ink">{title}</h2>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function ChangeText({
  value,
  pct,
  className,
}: {
  value?: number;
  pct?: number;
  className?: string;
}) {
  const ref = pct ?? value ?? 0;
  const up = ref >= 0;
  return (
    <span
      className={cn(
        "tnum font-semibold",
        up ? "text-up" : "text-down",
        className
      )}
    >
      {value !== undefined &&
        `${up ? "+" : "-"}$${Math.abs(value).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
      {value !== undefined && pct !== undefined && " "}
      {pct !== undefined && `(${up ? "+" : ""}${pct.toFixed(2)}%)`}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-ink-dim text-sm">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink-dim/40 border-t-ink-dim" />
      {label ?? "Loading…"}
    </div>
  );
}
