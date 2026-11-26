import { useMemo, useState } from "react";
import { MetricChart, WeightChart } from "@/components/Charts";
import { EmptyState } from "@/components/EmptyState";
import { MetricDialog } from "@/components/MetricDialog";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useFitness } from "@/context/FitnessContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/cn";
import { formatDateKey } from "@/lib/dates";
import { formatClock, formatDistance, formatKg, formatSigned, formatVolume, relativeDayLabel } from "@/lib/format";
import { MUSCLE_LABEL, allExercises } from "@/lib/exercises";
import { logMode } from "@/lib/session";
import {
  bestBy,
  exerciseSeries,
  featuredExerciseId,
  latestMetric,
  weightChange,
  weightSeries,
  type ExercisePoint,
} from "@/lib/stats";
import type { BodyMetric, Exercise } from "@/lib/types";

type Mode = "body" | "exercise";
type StrengthMetric = "maxWeight" | "e1rm" | "volume";
type CardioMetric = "durationSec" | "distanceKm";

export function ProgressPage() {
  usePageTitle("進度");
  const { sessions, metrics, customExercises, deleteMetric } = useFitness();
  const [mode, setMode] = useState<Mode>("body");
  const [metricOpen, setMetricOpen] = useState(false);
  const [editing, setEditing] = useState<BodyMetric | null>(null);
  const [picker, setPicker] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const todayKey = formatDateKey(new Date());
  const weights = weightSeries(metrics);
  const latest = latestMetric(metrics);
  const delta = weightChange(metrics, 30, todayKey);
  const hasFat = weights.some((point) => point.bodyFatPct != null);
  const [showFat, setShowFat] = useState(true);
  const library = allExercises(customExercises);
  const defaultId = featuredExerciseId(sessions) ?? "bench-press";
  const [exerciseId, setExerciseId] = useState(defaultId);
  const exercise = library.find((item) => item.id === exerciseId) ?? library[0];
  const points = useMemo(() => (exercise ? exerciseSeries(sessions, exercise.id) : []), [sessions, exercise]);
  const style = exercise ? logMode(exercise) : "strength";
  const [strengthMetric, setStrengthMetric] = useState<StrengthMetric>("e1rm");
  const [cardioMetric, setCardioMetric] = useState<CardioMetric>("distanceKm");
  const bodyweight = style === "strength" && points.length > 0 && points.every((point) => point.maxWeight <= 0);

  const chartPoints = points.map((point) => ({
    label: point.label,
    value: bodyweight
      ? point.reps
      : style === "strength"
        ? strengthMetric === "maxWeight"
          ? point.maxWeight
          : strengthMetric === "volume"
            ? point.volume
            : point.e1rm
        : cardioMetric === "durationSec"
          ? Math.round(point.durationSec / 60)
          : point.distanceKm,
  }));
  const unit = bodyweight ? "次" : style === "strength" ? "公斤" : cardioMetric === "durationSec" ? "分" : "公里";
  const best =
    style === "strength"
      ? bestBy(points, strengthMetric === "maxWeight" ? "maxWeight" : "e1rm")
      : bestBy(points, cardioMetric);

  return (
    <div>
      <PageHeader kicker="看得懂的變化" title="進度" />
      <div className="grid gap-4 px-4 pb-8">
        <div className="grid grid-cols-2 rounded-2xl bg-muted p-1">
          <Seg active={mode === "body"} onClick={() => setMode("body")}>
            體重
          </Seg>
          <Seg active={mode === "exercise"} onClick={() => setMode("exercise")}>
            動作
          </Seg>
        </div>
        {mode === "body" ? (
          <>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">最新</p>
                <p className="text-3xl font-semibold tabular-nums">
                  {latest ? formatKg(latest.weightKg) : "—"}
                  {latest ? <span className="ml-1 text-sm font-medium text-muted-foreground">公斤</span> : null}
                </p>
                {delta != null ? <p className="text-xs text-muted-foreground">近 30 天 {formatSigned(delta)} 公斤</p> : null}
              </div>
              <Button size="sm" onClick={() => { setEditing(null); setMetricOpen(true); }}>
                記錄體重
              </Button>
            </div>
            {hasFat ? (
              <button type="button" className="text-left text-sm text-primary" onClick={() => setShowFat((value) => !value)}>
                {showFat ? "隱藏體脂" : "顯示體脂"}
              </button>
            ) : null}
            {weights.length === 0 ? (
              <EmptyState title="還沒有體重" body="記下一筆之後，這裡會畫出變化。同一天再記會覆蓋那天的數字。" />
            ) : (
              <div className="rounded-3xl border border-border bg-card px-2 py-3">
                <WeightChart data={weights} showFat={showFat && hasFat} />
              </div>
            )}
            <ul className="grid gap-2">
              {[...metrics].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12).map((metric) => (
                <li key={metric.id} className="flex items-center justify-between rounded-2xl border border-border px-3 py-3">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { setEditing(metric); setMetricOpen(true); }}>
                    <span className="block text-sm">{relativeDayLabel(metric.date, todayKey)}</span>
                    <span className="block font-semibold tabular-nums">
                      {formatKg(metric.weightKg)} 公斤
                      {metric.bodyFatPct != null ? ` · 體脂 ${formatKg(metric.bodyFatPct)}%` : ""}
                    </span>
                  </button>
                  {pendingDelete === metric.id ? (
                    <button type="button" className="text-sm text-destructive" onClick={() => void deleteMetric(metric.id)}>
                      確定刪除
                    </button>
                  ) : (
                    <button type="button" className="text-sm text-muted-foreground" onClick={() => setPendingDelete(metric.id)}>
                      刪除
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPicker(true)}
              className="flex items-center justify-between rounded-3xl border border-border bg-card px-4 py-3 text-left"
            >
              <span>
                <span className="block text-xs text-muted-foreground">動作</span>
                <span className="block text-lg font-semibold">{exercise?.name ?? "選擇動作"}</span>
              </span>
              <span className="text-sm text-primary">更換</span>
            </button>
            {style === "strength" ? (
              bodyweight ? (
                <div className="flex flex-wrap gap-2">
                  <Seg active onClick={() => undefined}>總次數</Seg>
                </div>
              ) : (
              <div className="flex flex-wrap gap-2">
                <Seg active={strengthMetric === "e1rm"} onClick={() => setStrengthMetric("e1rm")}>預估 1RM</Seg>
                <Seg active={strengthMetric === "maxWeight"} onClick={() => setStrengthMetric("maxWeight")}>最大重量</Seg>
                <Seg active={strengthMetric === "volume"} onClick={() => setStrengthMetric("volume")}>總容量</Seg>
              </div>
              )
            ) : (
              <div className="flex flex-wrap gap-2">
                <Seg active={cardioMetric === "distanceKm"} onClick={() => setCardioMetric("distanceKm")}>最遠距離</Seg>
                <Seg active={cardioMetric === "durationSec"} onClick={() => setCardioMetric("durationSec")}>最長時間</Seg>
              </div>
            )}
            {points.length === 0 ? (
              <EmptyState title="這項還沒有完成的組數" body="練完並儲存之後，最大重量、預估 1RM 和容量會畫在這裡。1RM 用 Epley 公式估算。" />
            ) : (
              <>
                {best ? <BestCallout style={style} metric={style === "strength" ? strengthMetric : cardioMetric} point={best} /> : null}
                <div className="rounded-3xl border border-border bg-card px-2 py-3">
                  <MetricChart data={chartPoints} unit={unit} />
                </div>
                <ul className="grid gap-2">
                  {[...points].reverse().slice(0, 8).map((point) => (
                    <li key={point.date} className="flex items-baseline justify-between text-sm">
                      <span className="text-muted-foreground">{relativeDayLabel(point.date, todayKey)}</span>
                      <span className="tabular-nums">
                        {style === "strength"
                          ? point.maxWeight > 0
                            ? `${formatKg(point.maxWeight)} 公斤 · 1RM ${formatKg(point.e1rm)} · ${formatVolume(point.volume)}`
                            : `${point.reps} 次`
                          : `${formatClock(point.durationSec)}${point.distanceKm > 0 ? ` · ${formatDistance(point.distanceKm)} 公里` : ""}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
      <MetricDialog open={metricOpen} onOpenChange={setMetricOpen} initial={editing} />
      <Sheet open={picker} onOpenChange={setPicker} title="選擇動作" full>
        <ExerciseChoices
          exercises={library}
          counts={countByExercise(sessions)}
          onPick={(id) => {
            setExerciseId(id);
            setPicker(false);
          }}
        />
      </Sheet>
    </div>
  );
}

function countByExercise(sessions: { exercises: { exerciseId: string; sets: { completed: boolean }[] }[]; finishedAt: number | null }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    if (session.finishedAt == null) continue;
    for (const exercise of session.exercises) {
      if (!exercise.sets.some((set) => set.completed)) continue;
      counts.set(exercise.exerciseId, (counts.get(exercise.exerciseId) ?? 0) + 1);
    }
  }
  return counts;
}

function ExerciseChoices({
  exercises,
  counts,
  onPick,
}: {
  exercises: Exercise[];
  counts: Map<string, number>;
  onPick: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = exercises.filter((exercise) => exercise.name.includes(query.trim()));
  const ranked = filtered.slice().sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
  return (
    <div className="grid gap-3">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="搜尋動作"
        aria-label="搜尋動作"
        className="h-11 rounded-xl border border-input bg-card px-3 text-base outline-none focus:ring-2 focus:ring-ring"
      />
      <ul className="grid gap-1">
        {ranked.map((exercise) => (
          <li key={exercise.id}>
            <button type="button" className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left hover:bg-muted" onClick={() => onPick(exercise.id)}>
              <span>
                <span className="block font-medium">{exercise.name}</span>
                <span className="text-xs text-muted-foreground">{MUSCLE_LABEL[exercise.muscleGroup]}</span>
              </span>
              <span className="text-xs text-muted-foreground">{counts.get(exercise.id) ? `${counts.get(exercise.id)} 次` : ""}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BestCallout({
  style,
  metric,
  point,
}: {
  style: "strength" | "timed" | "cardio";
  metric: StrengthMetric | CardioMetric;
  point: ExercisePoint;
}) {
  const label = style === "strength" ? (metric === "maxWeight" ? "最重的一次" : metric === "volume" ? "容量最高的一天" : "最佳預估 1RM") : metric === "distanceKm" ? "最遠的一次" : "最長的一次";
  const value =
    style === "strength"
      ? metric === "volume"
        ? formatVolume(point.volume)
        : `${formatKg(metric === "maxWeight" ? point.maxWeight : point.e1rm)} 公斤`
      : metric === "distanceKm"
        ? `${formatDistance(point.distanceKm)} 公里`
        : formatClock(point.durationSec);
  return (
    <div className="rounded-3xl bg-accent px-4 py-3 text-accent-foreground">
      <p className="text-xs">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs">
        {point.label}
        {style === "strength" && point.bestWeight > 0 ? ` · ${formatKg(point.bestWeight)}×${point.bestReps}` : ""}
      </p>
    </div>
  );
}

function Seg({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("h-10 rounded-xl px-3 text-sm", active ? "bg-card font-medium shadow-sm" : "text-muted-foreground")}
    >
      {children}
    </button>
  );
}
