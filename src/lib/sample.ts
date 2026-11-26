import { addDays, daysBetween, formatDateKey, taipeiNoon, weekdayIndex } from "./dates.ts";
import { catalogExercise, defaultRoutines } from "./exercises.ts";
import type { AppData, BodyMetric, SessionExercise, WorkoutSession } from "./types.ts";

interface PlanExercise {
  id: string;
  sets: number;
  reps: number;
  base: number;
  inc: number;
  step: number;
  bodyweight?: boolean;
}

const PLANS: PlanExercise[][] = [
  [
    { id: "bench-press", sets: 4, reps: 6, base: 60, inc: 2.5, step: 2.5 },
    { id: "incline-dumbbell-press", sets: 3, reps: 10, base: 22, inc: 1, step: 1 },
    { id: "overhead-press", sets: 3, reps: 8, base: 40, inc: 1.25, step: 1.25 },
    { id: "lateral-raise", sets: 3, reps: 12, base: 8, inc: 0.5, step: 0.5 },
    { id: "tricep-pushdown", sets: 3, reps: 12, base: 25, inc: 1.25, step: 1.25 },
  ],
  [
    { id: "pull-up", sets: 3, reps: 5, base: 0, inc: 0, step: 1, bodyweight: true },
    { id: "barbell-row", sets: 4, reps: 8, base: 50, inc: 2.5, step: 2.5 },
    { id: "lat-pulldown", sets: 3, reps: 10, base: 45, inc: 2.5, step: 2.5 },
    { id: "face-pull", sets: 3, reps: 15, base: 15, inc: 1.25, step: 1.25 },
    { id: "barbell-curl", sets: 3, reps: 10, base: 25, inc: 1.25, step: 1.25 },
  ],
  [
    { id: "squat", sets: 4, reps: 5, base: 70, inc: 2.5, step: 2.5 },
    { id: "romanian-deadlift", sets: 3, reps: 8, base: 60, inc: 2.5, step: 2.5 },
    { id: "leg-press", sets: 3, reps: 10, base: 120, inc: 5, step: 5 },
    { id: "leg-curl", sets: 3, reps: 12, base: 30, inc: 2.5, step: 2.5 },
    { id: "calf-raise", sets: 3, reps: 12, base: 40, inc: 2.5, step: 2.5 },
  ],
];

const PLAN_NAMES = ["推", "拉", "腿"] as const;

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function slotForWeekday(weekday: number): 0 | 1 | 2 | null {
  if (weekday === 1) return 0;
  if (weekday === 3) return 1;
  if (weekday === 5) return 2;
  return null;
}

function makeBlock(plan: PlanExercise, week: number, dateKey: string): SessionExercise {
  const exercise = catalogExercise(plan.id);
  if (!exercise) throw new Error(`找不到動作 ${plan.id}`);
  const reps = plan.bodyweight ? plan.reps + Math.floor(week / 2) : plan.reps;
  const weight = plan.bodyweight ? null : roundTo(plan.base + week * plan.inc, plan.step);
  return {
    id: `sample-${dateKey}-${plan.id}`,
    exerciseId: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    kind: exercise.kind,
    timed: exercise.timed,
    sets: Array.from({ length: plan.sets }, (_, index) => ({
      id: `sample-${dateKey}-${plan.id}-${index}`,
      weightKg: weight,
      reps: Math.max(1, reps - (index === plan.sets - 1 ? 1 : 0)),
      durationSec: null,
      distanceKm: null,
      completed: true,
    })),
  };
}

function makeSession(dateKey: string, slot: 0 | 1 | 2, week: number): WorkoutSession {
  const plan = PLANS[slot] ?? PLANS[0]!;
  const finishedAt = taipeiNoon(dateKey);
  return {
    id: `sample-${dateKey}`,
    name: PLAN_NAMES[slot] ?? "訓練",
    startedAt: finishedAt - 55 * 60 * 1000,
    finishedAt,
    notes: "",
    routineId: ["routine-push", "routine-pull", "routine-legs"][slot] ?? null,
    exercises: plan.map((item) => makeBlock(item, week, dateKey)),
  };
}

export function buildSample(now: Date): AppData {
  const today = formatDateKey(now);
  const yesterday = addDays(today, -1);
  const start = addDays(today, -56);
  const sessions: WorkoutSession[] = [];
  let cursor = start;
  let first: string | null = null;
  while (cursor <= yesterday) {
    const slot = slotForWeekday(weekdayIndex(cursor));
    if (slot != null) {
      first ??= cursor;
      const week = Math.floor(daysBetween(first, cursor) / 7);
      sessions.push(makeSession(cursor, slot, week));
    }
    cursor = addDays(cursor, 1);
  }

  const covered = new Set(sessions.map((session) => formatDateKey(new Date(session.finishedAt!))));
  for (let offset = 1; offset <= 3; offset += 1) {
    const key = addDays(today, -offset);
    if (covered.has(key)) continue;
    const slot = ((3 - offset) % 3) as 0 | 1 | 2;
    const week = Math.max(0, Math.floor(daysBetween(start, key) / 7));
    sessions.push(makeSession(key, slot, week));
  }
  sessions.sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0));

  const metrics: BodyMetric[] = [];
  const span = Math.max(1, daysBetween(start, today));
  for (let offset = 0; offset <= span; offset += 3) {
    const date = addDays(start, offset);
    const progress = offset / span;
    const wave = Math.sin(offset / 2.2) * 0.18;
    metrics.push({
      id: `sample-metric-${date}`,
      date,
      weightKg: Math.round((74.8 - progress * 2.2 + wave) * 10) / 10,
      bodyFatPct: Math.round((22.8 - progress * 1.7 + wave * 0.4) * 10) / 10,
      createdAt: taipeiNoon(date),
    });
  }
  if (!metrics.some((metric) => metric.date === today)) {
    metrics.push({
      id: `sample-metric-${today}`,
      date: today,
      weightKg: 72.4,
      bodyFatPct: 21.1,
      createdAt: taipeiNoon(today),
    });
  }

  return {
    sessions,
    routines: defaultRoutines(taipeiNoon(start)),
    metrics,
    customExercises: [],
    settings: {
      theme: "system",
      restSec: 90,
      restEnabled: true,
      seeded: true,
    },
  };
}
