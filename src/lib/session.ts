import { uid } from "./ids.ts";
import type { LogMode, Routine, SessionExercise, WorkoutSet } from "./types.ts";

export function emptySet(): WorkoutSet {
  return {
    id: uid(),
    weightKg: null,
    reps: null,
    durationSec: null,
    distanceKm: null,
    completed: false,
  };
}

export function logMode(exercise: { kind: string; timed?: boolean }): LogMode {
  if (exercise.kind === "cardio") return "cardio";
  if (exercise.timed) return "timed";
  return "strength";
}

export function canComplete(
  exercise: { kind: string; timed?: boolean },
  set: Pick<WorkoutSet, "reps" | "durationSec" | "distanceKm">,
): boolean {
  if (logMode(exercise) === "strength") return (set.reps ?? 0) > 0;
  return (set.durationSec ?? 0) > 0 || (set.distanceKm ?? 0) > 0;
}

export function exercisesFromRoutine(routine: Routine): SessionExercise[] {
  return routine.exercises.map((exercise) => ({
    id: uid(),
    exerciseId: exercise.exerciseId,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    kind: exercise.kind,
    timed: exercise.timed,
    sets: [emptySet()],
  }));
}

export function sessionExerciseFromLibrary(exercise: {
  id: string;
  name: string;
  muscleGroup: SessionExercise["muscleGroup"];
  kind: SessionExercise["kind"];
  timed?: boolean;
}): SessionExercise {
  return {
    id: uid(),
    exerciseId: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    kind: exercise.kind,
    timed: exercise.timed,
    sets: [emptySet()],
  };
}
