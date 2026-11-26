import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatKg } from "@/lib/format";
import type { WeightPoint } from "@/lib/stats";

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduce;
}

function formatTick(value: number): string {
  if (Math.abs(value) >= 1000) {
    const compact = Math.round((value / 1000) * 10) / 10;
    return `${compact}k`;
  }
  return formatKg(value);
}

function Tip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown }>;
  label?: string | number;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  const raw = payload[0]?.value;
  if (typeof raw !== "number" && typeof raw !== "string") return null;
  return (
    <div className="rounded-xl bg-foreground px-3 py-2 text-xs text-background shadow-lg">
      <p>{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">
        {raw} {unit}
      </p>
    </div>
  );
}

function padDomain(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = min === max ? Math.max(Math.abs(max) * 0.08, 1) : (max - min) * 0.18;
  return [min - pad, max + pad];
}

export function WeightChart({ data, showFat }: { data: WeightPoint[]; showFat: boolean }) {
  const reduce = useReduceMotion();
  if (data.length === 0) return null;
  const domain = padDomain(data.map((point) => point.weightKg));
  const fatValues = data.map((point) => point.bodyFatPct).filter((value): value is number => value != null);
  const fatDomain = fatValues.length > 0 ? padDomain(fatValues) : undefined;
  return (
    <div className="h-56 w-full" data-testid="weight-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: showFat ? 8 : 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            yAxisId="weight"
            domain={domain}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={formatTick}
          />
          {showFat && fatDomain ? (
            <YAxis
              yAxisId="fat"
              orientation="right"
              domain={fatDomain}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={32}
              tickFormatter={formatTick}
            />
          ) : null}
          <Tooltip content={(props) => <Tip active={props.active} payload={props.payload} label={props.label} unit="公斤" />} />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="weightKg"
            name="體重"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={!reduce}
          />
          {showFat ? (
            <Line
              yAxisId="fat"
              type="monotone"
              dataKey="bodyFatPct"
              name="體脂"
              stroke="var(--muted-foreground)"
              strokeWidth={1.75}
              strokeDasharray="4 4"
              dot={false}
              connectNulls={false}
              isAnimationActive={!reduce}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MetricChart({
  data,
  unit,
}: {
  data: { label: string; value: number }[];
  unit: string;
}) {
  const reduce = useReduceMotion();
  if (data.length === 0) return null;
  const domain = padDomain(data.map((point) => point.value));
  return (
    <div className="h-56 w-full" data-testid="progress-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            domain={domain}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={formatTick}
          />
          <Tooltip content={(props) => <Tip active={props.active} payload={props.payload} label={props.label} unit={unit} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={!reduce}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
