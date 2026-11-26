import { DEFAULT_SETTINGS } from "./types.ts";
import type {
  AppData,
  AppSettings,
  BodyMetric,
  Exercise,
  ExerciseKind,
  MuscleGroup,
  Routine,
  SessionExercise,
  ThemeMode,
  WorkoutSession,
  WorkoutSet,
} from "./types.ts";

const MUSCLES = new Set<MuscleGroup>(["chest", "back", "legs", "shoulders", "arms", "core", "cardio"]);
const KINDS = new Set<ExerciseKind>(["strength", "cardio"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numOrNull(value: unknown): number | null | undefined {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

function isTheme(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function isSet(value: unknown): value is WorkoutSet {
  if (!isRecord(value) || typeof value.id !== "string") return false;
  if (typeof value.completed !== "boolean") return false;
  for (const key of ["weightKg", "reps", "durationSec", "distanceKm"] as const) {
    if (numOrNull(value[key]) === undefined) return false;
  }
  return true;
}

function isSessionExercise(value: unknown): value is SessionExercise {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || typeof value.exerciseId !== "string" || typeof value.name !== "string") {
    return false;
  }
  if (!MUSCLES.has(value.muscleGroup as MuscleGroup) || !KINDS.has(value.kind as ExerciseKind)) return false;
  if (!Array.isArray(value.sets) || !value.sets.every(isSet)) return false;
  return true;
}

function isSession(value: unknown): value is WorkoutSession {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || typeof value.name !== "string") return false;
  if (typeof value.startedAt !== "number" || !Number.isFinite(value.startedAt)) return false;
  if (value.finishedAt !== null && typeof value.finishedAt !== "number") return false;
  if (typeof value.notes !== "string") return false;
  if (value.routineId !== null && typeof value.routineId !== "string") return false;
  if (!Array.isArray(value.exercises) || !value.exercises.every(isSessionExercise)) return false;
  return true;
}

function isRoutine(value: unknown): value is Routine {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || typeof value.name !== "string") return false;
  if (typeof value.createdAt !== "number" || typeof value.updatedAt !== "number") return false;
  if (!Array.isArray(value.exercises)) return false;
  return value.exercises.every((exercise) => {
    if (!isRecord(exercise)) return false;
    return (
      typeof exercise.id === "string" &&
      typeof exercise.exerciseId === "string" &&
      typeof exercise.name === "string" &&
      MUSCLES.has(exercise.muscleGroup as MuscleGroup) &&
      KINDS.has(exercise.kind as ExerciseKind)
    );
  });
}

function isMetric(value: unknown): value is BodyMetric {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || typeof value.date !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return false;
  if (typeof value.weightKg !== "number" || !Number.isFinite(value.weightKg)) return false;
  if (value.bodyFatPct !== null && typeof value.bodyFatPct !== "number") return false;
  if (typeof value.createdAt !== "number") return false;
  return true;
}

function isExercise(value: unknown): value is Exercise {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    MUSCLES.has(value.muscleGroup as MuscleGroup) &&
    KINDS.has(value.kind as ExerciseKind) &&
    value.custom === true
  );
}

function settingsFrom(value: unknown): AppSettings {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS, seeded: true };
  const restSec = typeof value.restSec === "number" && value.restSec >= 15 && value.restSec <= 600
    ? value.restSec
    : DEFAULT_SETTINGS.restSec;
  return {
    theme: isTheme(value.theme) ? value.theme : "system",
    restSec,
    restEnabled: typeof value.restEnabled === "boolean" ? value.restEnabled : true,
    seeded: true,
  };
}

export function parseBackup(raw: unknown): AppData | null {
  if (!isRecord(raw)) return null;
  if (!Array.isArray(raw.sessions) || !Array.isArray(raw.routines) || !Array.isArray(raw.metrics)) return null;
  if (!raw.sessions.every(isSession)) return null;
  if (!raw.routines.every(isRoutine)) return null;
  if (!raw.metrics.every(isMetric)) return null;
  const custom = Array.isArray(raw.customExercises) ? raw.customExercises : [];
  if (!custom.every(isExercise)) return null;
  return {
    sessions: raw.sessions,
    routines: raw.routines,
    metrics: raw.metrics,
    customExercises: custom,
    settings: settingsFrom(raw.settings),
  };
}
