import type { ReactNode } from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { NumberField } from "@/components/NumberField";
import { MUSCLE_LABEL } from "@/lib/exercises";
import { formatClock, formatDistance, formatKg } from "@/lib/format";
import { logMode } from "@/lib/session";
import type { PreviousSet } from "@/lib/stats";
import type { SessionExercise, WorkoutSet } from "@/lib/types";

function brief(set: PreviousSet, mode: ReturnType<typeof logMode>): string {
  if (mode === "strength") {
    const reps = set.reps ?? 0;
    if ((set.weightKg ?? 0) > 0) return `${formatKg(set.weightKg ?? 0)}×${reps}`;
    return `${reps} 次`;
  }
  const parts: string[] = [];
  if ((set.durationSec ?? 0) > 0) parts.push(formatClock(set.durationSec ?? 0));
  if (mode === "cardio" && (set.distanceKm ?? 0) > 0) parts.push(`${formatDistance(set.distanceKm ?? 0)} 公里`);
  return parts.join(" · ") || "—";
}

export function ExerciseBlock({
  block,
  previous,
  onPatch,
  onToggle,
  onAddSet,
  onRemoveSet,
  onRemove,
  onMove,
  onFillPrevious,
  canMoveUp,
  canMoveDown,
}: {
  block: SessionExercise;
  previous: PreviousSet[] | null;
  onPatch: (setId: string, patch: Partial<WorkoutSet>) => void;
  onToggle: (setId: string) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onFillPrevious: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const mode = logMode(block);
  const untouched = block.sets.every((set) => !set.completed);
  return (
    <section className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{block.name}</h2>
          <p className="text-xs text-muted-foreground">{MUSCLE_LABEL[block.muscleGroup]}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <IconButton label="上移" disabled={!canMoveUp} onClick={() => onMove(-1)}>
            <ChevronUp className="size-4" />
          </IconButton>
          <IconButton label="下移" disabled={!canMoveDown} onClick={() => onMove(1)}>
            <ChevronDown className="size-4" />
          </IconButton>
        </div>
      </div>
      {previous && previous.length > 0 ? (
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <p className="min-w-0 truncate">上次 {previous.map((set) => brief(set, mode)).join(" · ")}</p>
          {untouched ? (
            <button type="button" className="shrink-0 font-medium text-primary" onClick={onFillPrevious}>
              帶入
            </button>
          ) : null}
        </div>
      ) : null}
      <ol className="mt-3 grid gap-2">
        {block.sets.map((set, index) => (
          <li key={set.id} className="grid grid-cols-[1.4rem_minmax(0,1fr)_2.75rem] items-center gap-2">
            <span className="text-center text-xs tabular-nums text-muted-foreground">{index + 1}</span>
            <div className="grid gap-2">
              {mode === "strength" ? (
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    value={set.weightKg}
                    onChange={(weightKg) => onPatch(set.id, { weightKg })}
                    label={`${block.name} 第 ${index + 1} 組重量`}
                    suffix="公斤"
                    testId={index === 0 ? "set-weight" : undefined}
                  />
                  <NumberField
                    value={set.reps}
                    onChange={(reps) => onPatch(set.id, { reps })}
                    label={`${block.name} 第 ${index + 1} 組次數`}
                    suffix="次"
                    integer
                    testId={index === 0 ? "set-reps" : undefined}
                  />
                </div>
              ) : (
                <DurationFields
                  blockName={block.name}
                  index={index}
                  durationSec={set.durationSec}
                  distanceKm={mode === "cardio" ? set.distanceKm : undefined}
                  onDuration={(durationSec) => onPatch(set.id, { durationSec })}
                  onDistance={mode === "cardio" ? (distanceKm) => onPatch(set.id, { distanceKm }) : undefined}
                />
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                aria-label={set.completed ? `取消第 ${index + 1} 組` : `完成第 ${index + 1} 組`}
                data-testid={index === 0 ? "set-done" : undefined}
                onClick={() => onToggle(set.id)}
                className={
                  set.completed
                    ? "grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"
                    : "grid size-11 place-items-center rounded-full border-2 border-border text-transparent"
                }
              >
                <Check className="size-5" />
              </button>
              {block.sets.length > 1 ? (
                <button type="button" aria-label={`移除第 ${index + 1} 組`} className="text-muted-foreground" onClick={() => onRemoveSet(set.id)}>
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex items-center justify-between">
        <button type="button" className="text-sm font-medium text-primary" onClick={onAddSet}>
          加一組
        </button>
        <button type="button" className="text-sm text-muted-foreground" onClick={onRemove}>
          移除此動作
        </button>
      </div>
    </section>
  );
}

function DurationFields({
  blockName,
  index,
  durationSec,
  distanceKm,
  onDuration,
  onDistance,
}: {
  blockName: string;
  index: number;
  durationSec: number | null;
  distanceKm?: number | null;
  onDuration: (value: number | null) => void;
  onDistance?: (value: number | null) => void;
}) {
  const minutes = durationSec == null ? null : Math.floor(durationSec / 60);
  const seconds = durationSec == null ? null : durationSec % 60;
  function commit(nextMin: number | null, nextSec: number | null) {
    if (nextMin == null && nextSec == null) {
      onDuration(null);
      return;
    }
    onDuration((nextMin ?? 0) * 60 + (nextSec ?? 0));
  }
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          value={minutes}
          integer
          suffix="分"
          label={`${blockName} 第 ${index + 1} 組分鐘`}
          onChange={(value) => commit(value, seconds)}
        />
        <NumberField
          value={seconds}
          integer
          suffix="秒"
          label={`${blockName} 第 ${index + 1} 組秒數`}
          onChange={(value) => commit(minutes, value)}
        />
      </div>
      {onDistance ? (
        <NumberField
          value={distanceKm ?? null}
          suffix="公里"
          label={`${blockName} 第 ${index + 1} 組距離`}
          onChange={onDistance}
        />
      ) : null}
    </div>
  );
}

function IconButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-30"
    >
      {children}
    </button>
  );
}
