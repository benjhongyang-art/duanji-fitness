import type { Exercise, MuscleGroup, Routine, RoutineExercise } from "./types.ts";

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: "胸",
  back: "背",
  legs: "腿",
  shoulders: "肩",
  arms: "手臂",
  core: "核心",
  cardio: "有氧",
};

export const MUSCLE_ORDER: MuscleGroup[] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "cardio",
];

export const CATALOG: Exercise[] = [
  { id: "bench-press", name: "槓鈴臥推", muscleGroup: "chest", kind: "strength", custom: false },
  { id: "incline-bench-press", name: "上斜槓鈴臥推", muscleGroup: "chest", kind: "strength", custom: false },
  { id: "dumbbell-bench-press", name: "啞鈴臥推", muscleGroup: "chest", kind: "strength", custom: false },
  { id: "incline-dumbbell-press", name: "上斜啞鈴臥推", muscleGroup: "chest", kind: "strength", custom: false },
  { id: "dumbbell-fly", name: "啞鈴飛鳥", muscleGroup: "chest", kind: "strength", custom: false },
  { id: "cable-crossover", name: "繩索夾胸", muscleGroup: "chest", kind: "strength", custom: false },
  { id: "push-up", name: "伏地挺身", muscleGroup: "chest", kind: "strength", custom: false },
  { id: "dip", name: "雙槓撐體", muscleGroup: "chest", kind: "strength", custom: false },
  { id: "machine-chest-press", name: "機械胸推", muscleGroup: "chest", kind: "strength", custom: false },

  { id: "pull-up", name: "引體向上", muscleGroup: "back", kind: "strength", custom: false },
  { id: "lat-pulldown", name: "高位下拉", muscleGroup: "back", kind: "strength", custom: false },
  { id: "barbell-row", name: "槓鈴划船", muscleGroup: "back", kind: "strength", custom: false },
  { id: "dumbbell-row", name: "啞鈴單臂划船", muscleGroup: "back", kind: "strength", custom: false },
  { id: "seated-cable-row", name: "坐姿划船", muscleGroup: "back", kind: "strength", custom: false },
  { id: "deadlift", name: "傳統硬舉", muscleGroup: "back", kind: "strength", custom: false },
  { id: "face-pull", name: "面拉", muscleGroup: "back", kind: "strength", custom: false },
  { id: "straight-arm-pulldown", name: "直臂下壓", muscleGroup: "back", kind: "strength", custom: false },
  { id: "back-extension", name: "背伸展", muscleGroup: "back", kind: "strength", custom: false },
  { id: "chest-supported-row", name: "胸托划船", muscleGroup: "back", kind: "strength", custom: false },

  { id: "squat", name: "槓鈴深蹲", muscleGroup: "legs", kind: "strength", custom: false },
  { id: "front-squat", name: "前蹲", muscleGroup: "legs", kind: "strength", custom: false },
  { id: "goblet-squat", name: "高腳杯深蹲", muscleGroup: "legs", kind: "strength", custom: false },
  { id: "leg-press", name: "腿推", muscleGroup: "legs", kind: "strength", custom: false },
  { id: "hack-squat", name: "哈克深蹲", muscleGroup: "legs", kind: "strength", custom: false },
  { id: "romanian-deadlift", name: "羅馬尼亞硬舉", muscleGroup: "legs", kind: "strength", custom: false },
  { id: "lunge", name: "弓步蹲", muscleGroup: "legs", kind: "strength", custom: false },
  { id: "bulgarian-split-squat", name: "保加利亞分腿蹲", muscleGroup: "legs", kind: "strength", custom: false },
  { id: "leg-extension", name: "腿伸展", muscleGroup: "legs", kind: "strength", custom: false },
  { id: "leg-curl", name: "腿彎舉", muscleGroup: "legs", kind: "strength", custom: false },
  { id: "hip-thrust", name: "臀推", muscleGroup: "legs", kind: "strength", custom: false },
  { id: "calf-raise", name: "站姿提踵", muscleGroup: "legs", kind: "strength", custom: false },

  { id: "overhead-press", name: "槓鈴肩推", muscleGroup: "shoulders", kind: "strength", custom: false },
  { id: "dumbbell-shoulder-press", name: "啞鈴肩推", muscleGroup: "shoulders", kind: "strength", custom: false },
  { id: "arnold-press", name: "阿諾肩推", muscleGroup: "shoulders", kind: "strength", custom: false },
  { id: "lateral-raise", name: "側平舉", muscleGroup: "shoulders", kind: "strength", custom: false },
  { id: "front-raise", name: "前平舉", muscleGroup: "shoulders", kind: "strength", custom: false },
  { id: "reverse-fly", name: "俯身飛鳥", muscleGroup: "shoulders", kind: "strength", custom: false },
  { id: "upright-row", name: "直立划船", muscleGroup: "shoulders", kind: "strength", custom: false },

  { id: "barbell-curl", name: "槓鈴彎舉", muscleGroup: "arms", kind: "strength", custom: false },
  { id: "dumbbell-curl", name: "啞鈴彎舉", muscleGroup: "arms", kind: "strength", custom: false },
  { id: "hammer-curl", name: "鎚式彎舉", muscleGroup: "arms", kind: "strength", custom: false },
  { id: "concentration-curl", name: "集中彎舉", muscleGroup: "arms", kind: "strength", custom: false },
  { id: "tricep-pushdown", name: "三頭肌下壓", muscleGroup: "arms", kind: "strength", custom: false },
  { id: "overhead-extension", name: "過頭三頭伸展", muscleGroup: "arms", kind: "strength", custom: false },
  { id: "skull-crusher", name: "仰臥三頭伸展", muscleGroup: "arms", kind: "strength", custom: false },
  { id: "close-grip-bench", name: "窄握臥推", muscleGroup: "arms", kind: "strength", custom: false },

  { id: "crunch", name: "捲腹", muscleGroup: "core", kind: "strength", custom: false },
  { id: "plank", name: "棒式", muscleGroup: "core", kind: "strength", timed: true, custom: false },
  { id: "side-plank", name: "側棒式", muscleGroup: "core", kind: "strength", timed: true, custom: false },
  { id: "hanging-leg-raise", name: "懸垂舉腿", muscleGroup: "core", kind: "strength", custom: false },
  { id: "russian-twist", name: "俄羅斯轉體", muscleGroup: "core", kind: "strength", custom: false },
  { id: "dead-bug", name: "死蟲", muscleGroup: "core", kind: "strength", custom: false },
  { id: "mountain-climber", name: "登山者", muscleGroup: "core", kind: "strength", custom: false },

  { id: "run", name: "跑步", muscleGroup: "cardio", kind: "cardio", custom: false },
  { id: "treadmill", name: "跑步機", muscleGroup: "cardio", kind: "cardio", custom: false },
  { id: "cycling", name: "飛輪", muscleGroup: "cardio", kind: "cardio", custom: false },
  { id: "rower", name: "划船機", muscleGroup: "cardio", kind: "cardio", custom: false },
  { id: "elliptical", name: "橢圓機", muscleGroup: "cardio", kind: "cardio", custom: false },
  { id: "jump-rope", name: "跳繩", muscleGroup: "cardio", kind: "cardio", custom: false },
  { id: "walk", name: "步行", muscleGroup: "cardio", kind: "cardio", custom: false },
  { id: "swim", name: "游泳", muscleGroup: "cardio", kind: "cardio", custom: false },
];

const catalogById = new Map(CATALOG.map((exercise) => [exercise.id, exercise]));

export function catalogExercise(id: string): Exercise | undefined {
  return catalogById.get(id);
}

export function allExercises(custom: Exercise[]): Exercise[] {
  const seen = new Set(CATALOG.map((exercise) => exercise.id));
  const extras = custom.filter((exercise) => {
    if (seen.has(exercise.id)) return false;
    seen.add(exercise.id);
    return true;
  });
  return [...CATALOG, ...extras];
}

function routineExercise(id: string): RoutineExercise {
  const exercise = catalogById.get(id);
  if (!exercise) throw new Error(`找不到動作 ${id}`);
  return {
    id: `re-${id}`,
    exerciseId: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    kind: exercise.kind,
    timed: exercise.timed,
  };
}

export function defaultRoutines(now = Date.now()): Routine[] {
  const make = (id: string, name: string, exerciseIds: string[]): Routine => ({
    id,
    name,
    createdAt: now,
    updatedAt: now,
    exercises: exerciseIds.map(routineExercise),
  });
  return [
    make("routine-push", "推", [
      "bench-press",
      "incline-dumbbell-press",
      "overhead-press",
      "lateral-raise",
      "tricep-pushdown",
    ]),
    make("routine-pull", "拉", [
      "pull-up",
      "barbell-row",
      "lat-pulldown",
      "face-pull",
      "barbell-curl",
    ]),
    make("routine-legs", "腿", [
      "squat",
      "romanian-deadlift",
      "leg-press",
      "leg-curl",
      "calf-raise",
    ]),
  ];
}

export function sortRoutines(routines: Routine[]): Routine[] {
  const rank = (id: string) => (id === "routine-push" ? 0 : id === "routine-pull" ? 1 : id === "routine-legs" ? 2 : 10);
  return routines.slice().sort((a, b) => rank(a.id) - rank(b.id) || a.createdAt - b.createdAt || a.name.localeCompare(b.name, "zh-Hant"));
}

export function routineSummary(routine: Routine): string {
  const labels = [...new Set(routine.exercises.map((exercise) => MUSCLE_LABEL[exercise.muscleGroup]))];
  const count = `${routine.exercises.length} 個動作`;
  return labels.length > 0 ? `${count} · ${labels.join(" · ")}` : count;
}
