import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { MetricDialog } from "@/components/MetricDialog";
import { PageHeader } from "@/components/PageHeader";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useFitness } from "@/context/FitnessContext";
import { WEEKDAY_LABELS, addDays, formatDateKey, startOfWeekMonday } from "@/lib/dates";
import { formatKg, formatSigned, formatTaiwanDate, formatVolume, greeting, relativeDayLabel, volumeParts } from "@/lib/format";
import { cn } from "@/lib/cn";
import { sortRoutines } from "@/lib/exercises";
import { latestMetric, streak, summarize, weekVolume, weightChange, workoutDateKeys, workoutsThisWeek } from "@/lib/stats";

export function HomePage() {
  usePageTitle("");
  const { sessions, routines, metrics, updateSettings } = useFitness();
  const starter = useStartWorkout();
  const [metricOpen, setMetricOpen] = useState(false);
  const today = new Date();
  const todayKey = formatDateKey(today);
  const weekStart = startOfWeekMonday(todayKey);
  const trained = workoutDateKeys(sessions);
  const count = workoutsThisWeek(sessions, today);
  const days = streak(sessions, today);
  const volume = volumeParts(weekVolume(sessions, today));
  const latest = latestMetric(metrics);
  const delta = weightChange(metrics, 30, todayKey);
  const todayMetric = metrics.find((metric) => metric.date === todayKey) ?? null;
  const recent = sessions
    .filter((session) => session.finishedAt != null)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
    .slice(0, 5);
  const dark = document.documentElement.classList.contains("dark");

  return (
    <div>
      <PageHeader
        kicker={formatTaiwanDate(todayKey, todayKey)}
        title={greeting(today)}
        action={
          <button
            type="button"
            aria-label={dark ? "切換淺色" : "切換深色"}
            className="grid size-11 place-items-center rounded-full border border-border"
            onClick={() => void updateSettings({ theme: dark ? "light" : "dark" })}
          >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        }
      />
      <div className="grid gap-4 px-4 pb-6">
        <p className="text-sm text-muted-foreground">
          {count > 0 ? `本週練了 ${count} 次` : "本週還沒練"}
          {days > 0 ? `，連續 ${days} 天` : ""}。
        </p>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAY_LABELS.map((label, index) => {
            const key = addDays(weekStart, index);
            const on = trained.has(key);
            const isToday = key === todayKey;
            return (
              <div key={key} className="flex flex-col items-center gap-1">
                <span className="text-[11px] text-muted-foreground">{label}</span>
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-full text-xs tabular-nums",
                    on ? "bg-primary text-primary-foreground" : "bg-muted",
                    isToday && !on && "ring-2 ring-primary/50",
                  )}
                >
                  {Number(key.slice(-2))}
                </span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="本週訓練" value={String(count)} unit="次" />
          <Stat label="連續天數" value={String(days)} unit="天" />
          <Stat label="本週容量" value={volume.value} unit={volume.unit} />
          <Stat
            label="體重"
            value={latest ? formatKg(latest.weightKg) : "—"}
            unit={latest ? "公斤" : ""}
            hint={delta == null ? undefined : `30 天 ${formatSigned(delta)}`}
          />
        </div>
        <button
          type="button"
          data-testid="start-blank"
          onClick={starter.startBlank}
          className="rounded-3xl bg-primary px-5 py-4 text-left text-primary-foreground"
        >
          <span className="block text-lg font-semibold">開始訓練</span>
          <span className="mt-0.5 block text-sm opacity-80">空白一堂，或從下面的課表開始</span>
        </button>
        {routines.length > 0 ? (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {sortRoutines(routines).map((routine) => (
              <button
                key={routine.id}
                type="button"
                onClick={() => starter.startRoutine(routine.id)}
                className="h-11 shrink-0 rounded-full bg-card px-4 text-sm font-medium ring-1 ring-border"
              >
                {routine.name}
              </button>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setMetricOpen(true)}
          className="flex items-center justify-between rounded-2xl border border-dashed border-border px-4 py-3 text-left"
        >
          <span>
            <span className="block text-sm font-medium">
              {todayMetric ? `今天 ${formatKg(todayMetric.weightKg)} 公斤` : "今天的體重還沒記"}
            </span>
            <span className="block text-xs text-muted-foreground">
              {todayMetric?.bodyFatPct != null ? `體脂 ${formatKg(todayMetric.bodyFatPct)}%` : "早上量最穩定"}
            </span>
          </span>
          <span className="text-sm font-medium text-primary">{todayMetric ? "修改" : "記錄"}</span>
        </button>
        <section className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium">最近</h2>
            <Link to="/history" className="text-sm text-primary">
              全部紀錄
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState title="還沒有完成的訓練" body="從一堂空白訓練，或推、拉、腿課表開始。練完會出現在這裡。" />
          ) : (
            recent.map((session) => {
              const summary = summarize(session);
              const key = formatDateKey(new Date(session.finishedAt!));
              return (
                <Link key={session.id} to={`/history/${session.id}`} className="rounded-3xl border border-border bg-card px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold">{session.name}</p>
                    <p className="text-sm text-muted-foreground">{relativeDayLabel(key, todayKey)}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {summary.exerciseCount} 個動作 · {summary.setCount} 組
                    {summary.volumeKg > 0 ? ` · ${formatVolume(summary.volumeKg)}` : ""} · {Math.max(1, Math.round(summary.durationSec / 60))} 分
                  </p>
                </Link>
              );
            })
          )}
        </section>
      </div>
      {starter.dialog}
      <MetricDialog open={metricOpen} onOpenChange={setMetricOpen} initial={todayMetric} />
    </div>
  );
}

function Stat({ label, value, unit, hint }: { label: string; value: string; unit: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
        {unit ? <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
