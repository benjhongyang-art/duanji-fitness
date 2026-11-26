export type MuscleGroup = "chest" | "back" | "legs" | "shoulders" | "arms" | "core" | "cardio";

export type ExerciseKind = "strength" | "cardio";

export type ThemeMode = "system" | "light" | "dark";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  kind: ExerciseKind;
  timed?: boolean;
  custom: boolean;
}

export interface WorkoutSet {
  id: string;
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
  distanceKm: number | null;
  completed: boolean;
}

export interface SessionExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  kind: ExerciseKind;
  timed?: boolean;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  name: string;
  startedAt: number;
  finishedAt: number | null;
  notes: string;
  routineId: string | null;
  exercises: SessionExercise[];
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  kind: ExerciseKind;
  timed?: boolean;
}

export interface Routine {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  exercises: RoutineExercise[];
}

export interface BodyMetric {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPct: number | null;
  createdAt: number;
}

export interface AppSettings {
  theme: ThemeMode;
  restSec: number;
  restEnabled: boolean;
  seeded: boolean;
}

export interface SettingsRecord extends AppSettings {
  key: "settings";
}

export interface AppData {
  sessions: WorkoutSession[];
  routines: Routine[];
  metrics: BodyMetric[];
  customExercises: Exercise[];
  settings: AppSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  restSec: 90,
  restEnabled: true,
  seeded: false,
};

export type LogMode = "strength" | "timed" | "cardio";
