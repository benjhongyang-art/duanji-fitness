import { addDays, formatDateKey, startOfWeekMonday } from "./dates.ts";
import { shortLabel } from "./format.ts";
import type { BodyMetric, WorkoutSession, WorkoutSet } from "./types.ts";

export function epley1Rm(weightKg: number, reps: number): number {
  if (!(weightKg > 0) || !(reps > 0)) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function setVolume(set: Pick<WorkoutSet, "completed" | "weightKg" | "reps">): number {
  if (!set.completed) return 0;
  const weight = set.weightKg ?? 0;
  const reps = set.reps ?? 0;
  if (weight <= 0 || reps <= 0) return 0;
  return weight * reps;
}

export interface SessionSummary {
  exerciseCount: number;
  setCount: number;
  volumeKg: number;
  durationSec: number;
}

export function summarize(session: WorkoutSession, now = session.finishedAt ?? session.startedAt): SessionSummary {
  let setCount = 0;
  let volumeKg = 0;
  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      if (!set.completed) continue;
      setCount += 1;
      volumeKg += setVolume(set);
    }
  }
  const end = session.finishedAt ?? now;
  return {
    exerciseCount: session.exercises.length,
    setCount,
    volumeKg,
    durationSec: Math.max(0, Math.round((end - session.startedAt) / 1000)),
  };
}

export function finishedSessions(sessions: WorkoutSession[]): WorkoutSession[] {
  return sessions.filter((session) => session.finishedAt != null);
}

export function workoutDateKeys(sessions: WorkoutSession[]): Set<string> {
  const dates = new Set<string>();
  for (const session of sessions) {
    if (session.finishedAt == null) continue;
    dates.add(formatDateKey(new Date(session.finishedAt)));
  }
  return dates;
}

export function streak(sessions: WorkoutSession[], today = new Date()): number {
  const dates = workoutDateKeys(sessions);
  const todayKey = formatDateKey(today);
  let cursor = dates.has(todayKey) ? todayKey : addDays(todayKey, -1);
  if (!dates.has(cursor)) return 0;
  let count = 0;
  while (dates.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

function inWeek(key: string, todayKey: string): boolean {
  const start = startOfWeekMonday(todayKey);
  const end = addDays(start, 7);
  return key >= start && key < end;
}

export function workoutsThisWeek(sessions: WorkoutSession[], today = new Date()): number {
  const todayKey = formatDateKey(today);
  return finishedSessions(sessions).filter((session) =>
    inWeek(formatDateKey(new Date(session.finishedAt!)), todayKey),
  ).length;
}

export function weekVolume(sessions: WorkoutSession[], today = new Date()): number {
  const todayKey = formatDateKey(today);
  return finishedSessions(sessions)
    .filter((session) => inWeek(formatDateKey(new Date(session.finishedAt!)), todayKey))
    .reduce((total, session) => total + summarize(session).volumeKg, 0);
}

export interface ExercisePoint {
  date: string;
  label: string;
  maxWeight: number;
  e1rm: number;
  volume: number;
  reps: number;
  durationSec: number;
  distanceKm: number;
  bestWeight: number;
  bestReps: number;
}

export function exerciseSeries(sessions: WorkoutSession[], exerciseId: string): ExercisePoint[] {
  const map = new Map<string, ExercisePoint>();
  const finished = finishedSessions(sessions).sort((a, b) => a.finishedAt! - b.finishedAt!);
  for (const session of finished) {
    const blocks = session.exercises.filter((exercise) => exercise.exerciseId === exerciseId);
    if (blocks.length === 0) continue;
    const date = formatDateKey(new Date(session.finishedAt!));
    let point = map.get(date);
    let any = false;
    if (!point) {
      point = {
        date,
        label: shortLabel(date),
        maxWeight: 0,
        e1rm: 0,
        volume: 0,
        reps: 0,
        durationSec: 0,
        distanceKm: 0,
        bestWeight: 0,
        bestReps: 0,
      };
    }
    for (const block of blocks) {
      for (const set of block.sets) {
        if (!set.completed) continue;
        any = true;
        const weight = set.weightKg ?? 0;
        const reps = set.reps ?? 0;
        point.volume += setVolume(set);
        if (reps > 0) point.reps += reps;
        point.durationSec += set.durationSec ?? 0;
        point.distanceKm += set.distanceKm ?? 0;
        if (weight > point.maxWeight) point.maxWeight = weight;
        const estimate = epley1Rm(weight, reps);
        if (estimate > point.e1rm) {
          point.e1rm = estimate;
          point.bestWeight = weight;
          point.bestReps = reps;
        }
      }
    }
    if (any) map.set(date, point);
  }
  return [...map.values()].map((point) => ({
    ...point,
    e1rm: Math.round(point.e1rm * 10) / 10,
    volume: Math.round(point.volume * 10) / 10,
    distanceKm: Math.round(point.distanceKm * 100) / 100,
  }));
}

export function bestBy(points: ExercisePoint[], key: "e1rm" | "maxWeight" | "durationSec" | "distanceKm"): ExercisePoint | null {
  let best: ExercisePoint | null = null;
  for (const point of points) {
    if (point[key] <= 0) continue;
    if (!best || point[key] > best[key]) best = point;
  }
  return best;
}

export interface PreviousSet {
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
  distanceKm: number | null;
}

export function lastCompletedSets(
  sessions: WorkoutSession[],
  exerciseId: string,
  excludeSessionId?: string,
): PreviousSet[] | null {
  const finished = finishedSessions(sessions)
    .filter((session) => session.id !== excludeSessionId)
    .sort((a, b) => b.finishedAt! - a.finishedAt!);
  for (const session of finished) {
    const sets = session.exercises
      .filter((exercise) => exercise.exerciseId === exerciseId)
      .flatMap((exercise) => exercise.sets.filter((set) => set.completed));
    if (sets.length === 0) continue;
    return sets.map((set) => ({
      weightKg: set.weightKg,
      reps: set.reps,
      durationSec: set.durationSec,
      distanceKm: set.distanceKm,
    }));
  }
  return null;
}

export function recentExerciseIds(sessions: WorkoutSession[], limit = 6): string[] {
  const finished = finishedSessions(sessions).sort((a, b) => b.finishedAt! - a.finishedAt!);
  const ids: string[] = [];
  for (const session of finished) {
    for (const exercise of session.exercises) {
      if (!ids.includes(exercise.exerciseId)) ids.push(exercise.exerciseId);
      if (ids.length >= limit) return ids;
    }
  }
  return ids;
}

export function activeSessionOf(sessions: WorkoutSession[]): WorkoutSession | null {
  const open = sessions.filter((session) => session.finishedAt == null);
  open.sort((a, b) => b.startedAt - a.startedAt);
  return open[0] ?? null;
}

export interface MonthGroup {
  key: string;
  label: string;
  items: WorkoutSession[];
}

export function groupByMonth(sessions: WorkoutSession[]): MonthGroup[] {
  const finished = finishedSessions(sessions).sort((a, b) => b.finishedAt! - a.finishedAt!);
  const groups = new Map<string, WorkoutSession[]>();
  for (const session of finished) {
    const key = formatDateKey(new Date(session.finishedAt!)).slice(0, 7);
    const list = groups.get(key) ?? [];
    list.push(session);
    groups.set(key, list);
  }
  return [...groups.entries()].map(([key, items]) => ({
    key,
    label: `${key.slice(0, 4)}年${Number(key.slice(5))}月`,
    items,
  }));
}

export interface WeightPoint {
  date: string;
  label: string;
  weightKg: number;
  bodyFatPct: number | null;
}

export function weightSeries(metrics: BodyMetric[]): WeightPoint[] {
  const byDate = new Map<string, BodyMetric>();
  for (const metric of metrics) {
    const previous = byDate.get(metric.date);
    if (!previous || metric.createdAt >= previous.createdAt) byDate.set(metric.date, metric);
  }
  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((metric) => ({
      date: metric.date,
      label: shortLabel(metric.date),
      weightKg: metric.weightKg,
      bodyFatPct: metric.bodyFatPct,
    }));
}

export function latestMetric(metrics: BodyMetric[]): BodyMetric | null {
  const series = [...metrics].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  return series.at(-1) ?? null;
}

export function weightChange(metrics: BodyMetric[], days: number, todayKey: string): number | null {
  const series = weightSeries(metrics).filter((point) => point.date <= todayKey);
  if (series.length < 2) return null;
  const latest = series[series.length - 1];
  if (!latest) return null;
  const target = addDays(todayKey, -days);
  const baseline = [...series].reverse().find((point) => point.date <= target) ?? series[0];
  if (!baseline || baseline.date === latest.date) return null;
  return Math.round((latest.weightKg - baseline.weightKg) * 10) / 10;
}

export function upsertMetric(list: BodyMetric[], metric: BodyMetric): BodyMetric[] {
  return [...list.filter((item) => item.date !== metric.date && item.id !== metric.id), metric].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export function featuredExerciseId(sessions: WorkoutSession[]): string | null {
  const ids = new Set<string>();
  for (const session of finishedSessions(sessions)) {
    for (const exercise of session.exercises) {
      if (exercise.sets.some((set) => set.completed)) ids.add(exercise.exerciseId);
    }
  }
  let best: { id: string; score: number } | null = null;
  for (const id of ids) {
    const points = exerciseSeries(sessions, id);
    const peak = points.reduce((max, point) => Math.max(max, point.e1rm, point.maxWeight), 0);
    const volume = points.reduce((total, point) => total + point.volume, 0);
    const score = peak * 1000 + volume + points.length;
    if (!best || score > best.score) best = { id, score };
  }
  return best?.id ?? null;
}

export function mostTrackedExerciseId(sessions: WorkoutSession[]): string | null {
  const counts = new Map<string, { count: number; latest: number }>();
  for (const session of finishedSessions(sessions)) {
    for (const exercise of session.exercises) {
      const completed = exercise.sets.some((set) => set.completed);
      if (!completed) continue;
      const current = counts.get(exercise.exerciseId) ?? { count: 0, latest: 0 };
      current.count += 1;
      current.latest = Math.max(current.latest, session.finishedAt ?? 0);
      counts.set(exercise.exerciseId, current);
    }
  }
  let best: { id: string; count: number; latest: number } | null = null;
  for (const [id, value] of counts) {
    if (!best || value.count > best.count || (value.count === best.count && value.latest > best.latest)) {
      best = { id, ...value };
    }
  }
  return best?.id ?? null;
}
