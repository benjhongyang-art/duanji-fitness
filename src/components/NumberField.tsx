import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatInput, parseNum } from "@/lib/format";

export function NumberField({
  value,
  onChange,
  label,
  suffix,
  integer = false,
  testId,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
  suffix?: string;
  integer?: boolean;
  testId?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const focused = useRef(false);
  const [text, setText] = useState(() => formatInput(value));

  useEffect(() => {
    if (focused.current) return;
    setText(formatInput(value));
  }, [value]);

  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>
      <input
        ref={ref}
        data-testid={testId}
        inputMode={integer ? "numeric" : "decimal"}
        enterKeyHint="done"
        autoComplete="off"
        aria-label={label}
        placeholder="—"
        className={cn(
          "h-12 w-full rounded-xl bg-muted px-2 text-right text-lg font-semibold tabular-nums outline-none focus:ring-2 focus:ring-ring",
          suffix ? "pr-8" : "pr-2",
        )}
        value={text}
        onFocus={(event) => {
          focused.current = true;
          event.currentTarget.select();
        }}
        onBlur={() => {
          focused.current = false;
          const parsed = parseNum(text);
          const next = parsed == null ? null : integer ? Math.floor(parsed) : parsed;
          onChange(next);
          setText(formatInput(next));
        }}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw !== "" && !(integer ? /^\d*$/ : /^\d*[.,]?\d*$/).test(raw)) return;
          setText(raw);
          const parsed = parseNum(raw);
          onChange(parsed == null ? null : integer ? Math.floor(parsed) : parsed);
        }}
      />
      {suffix ? (
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[11px] text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </label>
  );
}
