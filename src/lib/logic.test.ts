import { describe, expect, it } from "vitest";
import { addDays, formatDateKey, startOfWeekMonday, taipeiNoon, weekdayIndex } from "./dates.ts";
import { defaultRoutines, CATALOG } from "./exercises.ts";
import { formatVolume, greeting, parseNum } from "./format.ts";
import { buildSample } from "./sample.ts";
import { canComplete, exercisesFromRoutine } from "./session.ts";
import {
  epley1Rm,
  exerciseSeries,
  featuredExerciseId,
  groupByMonth,
  recentExerciseIds,
  setVolume,
  streak,
  summarize,
  upsertMetric,
  weekVolume,
  weightChange,
  workoutsThisWeek,
} from "./stats.ts";
import { parseBackup } from "./validate.ts";
import type { BodyMetric, WorkoutSession, WorkoutSet } from "./types.ts";

const NOON = new Date("2026-11-26T04:00:00Z");

function sessionOn(date: string, sets: WorkoutSet[] = [completed(100, 5)]): WorkoutSession {
  const finishedAt = taipeiNoon(date);
  return {
    id: `s-${date}`,
    name: "測試",
    startedAt: finishedAt - 30 * 60 * 1000,
    finishedAt,
    notes: "",
    routineId: null,
    exercises: [
      {
        id: "block",
        exerciseId: "bench-press",
        name: "槓鈴臥推",
        muscleGroup: "chest",
        kind: "strength",
        sets,
      },
    ],
  };
}

function completed(weightKg: number | null, reps: number | null, done = true): WorkoutSet {
  return {
    id: `set-${weightKg}-${reps}-${done}`,
    weightKg,
    reps,
    durationSec: null,
    distanceKm: null,
    completed: done,
  };
}

describe("dates", () => {
  it("uses the Taipei calendar around midnight", () => {
    expect(formatDateKey(new Date("2026-11-25T15:59:00Z"))).toBe("2026-11-25");
    expect(formatDateKey(new Date("2026-11-25T16:00:00Z"))).toBe("2026-11-26");
  });

  it("starts weeks on Monday and crosses month boundaries", () => {
    expect(weekdayIndex("2026-11-26")).toBe(4);
    expect(startOfWeekMonday("2026-11-26")).toBe("2026-11-23");
    expect(startOfWeekMonday("2026-11-23")).toBe("2026-11-23");
    expect(startOfWeekMonday("2026-11-29")).toBe("2026-11-23");
    expect(startOfWeekMonday("2026-11-22")).toBe("2026-11-16");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
});

describe("strength math", () => {
  it("estimates 1RM with Epley and ignores empty loads", () => {
    expect(epley1Rm(100, 1)).toBe(100);
    expect(epley1Rm(100, 10)).toBeCloseTo(133.333, 2);
    expect(epley1Rm(0, 10)).toBe(0);
    expect(epley1Rm(100, 0)).toBe(0);
  });

  it("counts only completed weighted sets toward volume", () => {
    expect(setVolume(completed(80, 8))).toBe(640);
    expect(setVolume(completed(80, 8, false))).toBe(0);
    expect(setVolume(completed(0, 8))).toBe(0);
    const summary = summarize(sessionOn("2026-11-26", [completed(100, 5), completed(100, 5, false)]));
    expect(summary.setCount).toBe(1);
    expect(summary.volumeKg).toBe(500);
    expect(formatVolume(12400)).toBe("12.4 噸");
  });

  it("requires reps for strength and time or distance for cardio", () => {
    expect(canComplete({ kind: "strength" }, { reps: 5, durationSec: null, distanceKm: null })).toBe(true);
    expect(canComplete({ kind: "strength" }, { reps: 0, durationSec: null, distanceKm: null })).toBe(false);
    expect(canComplete({ kind: "cardio" }, { reps: null, durationSec: 60, distanceKm: null })).toBe(true);
    expect(canComplete({ kind: "strength", timed: true }, { reps: null, durationSec: 0, distanceKm: 1 })).toBe(true);
  });
});

describe("streak and week", () => {
  it("keeps a streak alive through today or yesterday", () => {
    expect(streak([sessionOn("2026-11-24"), sessionOn("2026-11-25"), sessionOn("2026-11-26")], NOON)).toBe(3);
    expect(streak([sessionOn("2026-11-24"), sessionOn("2026-11-25")], NOON)).toBe(2);
    expect(streak([sessionOn("2026-11-23")], NOON)).toBe(0);
    expect(streak([sessionOn("2026-02-27"), sessionOn("2026-02-28"), sessionOn("2026-03-01")], new Date("2026-03-01T04:00:00Z"))).toBe(3);
  });

  it("counts the Monday-Sunday week in Taipei", () => {
    const sessions = [sessionOn("2026-11-16"), sessionOn("2026-11-23"), sessionOn("2026-11-25"), sessionOn("2026-11-26")];
    expect(workoutsThisWeek(sessions, NOON)).toBe(3);
    expect(weekVolume([sessionOn("2026-11-26", [completed(100, 10)])], NOON)).toBe(1000);
    expect(weekVolume([sessionOn("2026-11-16", [completed(100, 10)])], NOON)).toBe(0);
  });
});

describe("progress series", () => {
  it("keeps the best set per day and ignores unfinished work", () => {
    const open: WorkoutSession = { ...sessionOn("2026-11-26", [completed(200, 1)]), finishedAt: null };
    const series = exerciseSeries(
      [sessionOn("2026-11-23", [completed(60, 5), completed(50, 8)]), sessionOn("2026-11-25", [completed(70, 3)]), open],
      "bench-press",
    );
    expect(series.map((point) => point.maxWeight)).toEqual([60, 70]);
    expect(series[0]?.e1rm).toBeCloseTo(epley1Rm(60, 5), 1);
    expect(series[1]?.e1rm).toBeCloseTo(epley1Rm(70, 3), 1);
  });

  it("replaces a body-weight entry on the same date", () => {
    const first: BodyMetric = { id: "a", date: "2026-11-20", weightKg: 74, bodyFatPct: 22, createdAt: 1 };
    const next: BodyMetric = { id: "b", date: "2026-11-20", weightKg: 73.4, bodyFatPct: null, createdAt: 2 };
    const list = upsertMetric([first], next);
    expect(list).toHaveLength(1);
    expect(list[0]?.weightKg).toBe(73.4);
    expect(weightChange([first, { ...next, date: "2026-11-26", id: "c" }], 30, "2026-11-26")).toBeCloseTo(-0.6, 1);
  });
});

describe("routines and sample", () => {
  it("ships push pull legs from the catalog", () => {
    const routines = defaultRoutines();
    expect(routines.map((routine) => routine.name)).toEqual(["推", "拉", "腿"]);
    const ids = new Set(CATALOG.map((exercise) => exercise.id));
    for (const routine of routines) {
      expect(routine.exercises.length).toBeGreaterThan(0);
      for (const exercise of routine.exercises) expect(ids.has(exercise.exerciseId)).toBe(true);
    }
    const blocks = exercisesFromRoutine(routines[0]!);
    expect(blocks).toHaveLength(routines[0]!.exercises.length);
    expect(blocks[0]?.sets).toHaveLength(1);
    expect(blocks[0]?.sets[0]?.completed).toBe(false);
    expect(new Set(blocks.map((block) => block.id)).size).toBe(blocks.length);
  });

  it("builds several weeks of finished weekday workouts and a weight log", () => {
    const sample = buildSample(NOON);
    const today = formatDateKey(NOON);
    expect(sample.sessions.length).toBeGreaterThan(12);
    for (const session of sample.sessions) {
      expect(session.finishedAt).not.toBeNull();
      const key = formatDateKey(new Date(session.finishedAt!));
      expect(key < today).toBe(true);
    }
    expect(streak(sample.sessions, NOON)).toBeGreaterThanOrEqual(3);
    const planned = sample.sessions.filter((session) =>
      [1, 3, 5].includes(weekdayIndex(formatDateKey(new Date(session.finishedAt!)))),
    );
    expect(planned.length).toBeGreaterThan(12);
    const featured = featuredExerciseId(sample.sessions);
    expect(featured).toBeTruthy();
    expect(exerciseSeries(sample.sessions, featured!)[0]?.maxWeight).toBeGreaterThan(0);
    const bench = exerciseSeries(sample.sessions, "bench-press");
    expect(bench.length).toBeGreaterThan(4);
    expect(bench.at(-1)!.maxWeight).toBeGreaterThan(bench[0]!.maxWeight);
    expect(sample.metrics.some((metric) => metric.date === today)).toBe(true);
    expect(recentExerciseIds(sample.sessions)[0]).toBeTruthy();
    expect(groupByMonth(sample.sessions).length).toBeGreaterThan(0);
    const raw = { app: "duanji", version: 1, exportedAt: "2026-11-26T00:00:00.000Z", ...sample };
    expect(parseBackup(raw)?.sessions).toHaveLength(sample.sessions.length);
    expect(parseBackup({ hello: true })).toBeNull();
    expect(parseBackup({ ...raw, sessions: [{ id: "bad" }] })).toBeNull();
  });
});

describe("copy helpers", () => {
  it("greets by Taipei hour and parses decimal input", () => {
    expect(greeting(new Date("2026-11-26T00:30:00Z"))).toBe("早安");
    expect(greeting(new Date("2026-11-25T16:30:00Z"))).toBe("夜深了");
    expect(parseNum("22,5")).toBe(22.5);
    expect(parseNum("")).toBeNull();
    expect(parseNum("-1")).toBeNull();
  });
});
