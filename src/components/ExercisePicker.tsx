import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useFitness } from "@/context/FitnessContext";
import { cn } from "@/lib/cn";
import { MUSCLE_LABEL, MUSCLE_ORDER, allExercises } from "@/lib/exercises";
import { uid } from "@/lib/ids";
import { recentExerciseIds } from "@/lib/stats";
import type { Exercise, ExerciseKind, MuscleGroup } from "@/lib/types";

export function ExercisePicker({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (exercise: Exercise) => void;
}) {
  const { customExercises, sessions, addCustomExercise, notify } = useFitness();
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "all">("all");
  const [customOpen, setCustomOpen] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState<MuscleGroup>("chest");
  const [kind, setKind] = useState<ExerciseKind>("strength");
  const [timed, setTimed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setMuscle("all");
    setCustomOpen(false);
    setName("");
    setGroup("chest");
    setKind("strength");
    setTimed(false);
  }, [open]);

  const exercises = allExercises(customExercises);
  const recent = recentExerciseIds(sessions);
  const filtered = useMemo(() => {
    const q = query.trim();
    return exercises.filter((exercise) => {
      if (muscle !== "all" && exercise.muscleGroup !== muscle) return false;
      if (!q) return true;
      return exercise.name.includes(q);
    });
  }, [exercises, muscle, query]);

  const recentExercises =
    muscle === "all" && query.trim() === ""
      ? recent
          .map((id) => exercises.find((exercise) => exercise.id === id))
          .filter((exercise): exercise is Exercise => Boolean(exercise))
      : [];

  async function createCustom() {
    const trimmed = name.trim();
    if (!trimmed) {
      notify("先寫動作名稱");
      return;
    }
    const exercise: Exercise = {
      id: uid(),
      name: trimmed.slice(0, 30),
      muscleGroup: kind === "cardio" ? "cardio" : group,
      kind,
      timed: kind === "strength" ? timed : undefined,
      custom: true,
    };
    await addCustomExercise(exercise);
    onPick(exercise);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="加一個動作" description="從動作庫選，或自己新增。" full>
      <div className="grid gap-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜尋，例如臥推"
          aria-label="搜尋動作"
          data-testid="exercise-search"
        />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={muscle === "all"} onClick={() => setMuscle("all")}>
            全部
          </Chip>
          {MUSCLE_ORDER.map((item) => (
            <Chip key={item} active={muscle === item} onClick={() => setMuscle(item)}>
              {MUSCLE_LABEL[item]}
            </Chip>
          ))}
        </div>

        <button
          type="button"
          className="text-left text-sm font-medium text-primary"
          onClick={() => setCustomOpen((value) => !value)}
        >
          {customOpen ? "收合自訂動作" : "自訂動作"}
        </button>
        {customOpen ? (
          <div className="grid gap-3 rounded-2xl bg-muted p-3">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="動作名稱"
              aria-label="自訂動作名稱"
              maxLength={30}
            />
            <div className="grid grid-cols-2 gap-2">
              <Chip active={kind === "strength"} onClick={() => setKind("strength")}>
                重訓
              </Chip>
              <Chip
                active={kind === "cardio"}
                onClick={() => {
                  setKind("cardio");
                  setGroup("cardio");
                  setTimed(false);
                }}
              >
                有氧
              </Chip>
            </div>
            {kind === "strength" ? (
              <div className="flex flex-wrap gap-2">
                {MUSCLE_ORDER.filter((item) => item !== "cardio").map((item) => (
                  <Chip key={item} active={group === item} onClick={() => setGroup(item)}>
                    {MUSCLE_LABEL[item]}
                  </Chip>
                ))}
              </div>
            ) : null}
            {kind === "strength" ? (
              <button type="button" className="text-left text-sm" onClick={() => setTimed((value) => !value)}>
                <span className={cn("mr-2 inline-block size-4 rounded border align-middle", timed && "border-primary bg-primary")} />
                以時間記錄（例如棒式）
              </button>
            ) : null}
            <Button onClick={() => void createCustom()}>加入這個動作</Button>
          </div>
        ) : null}

        {recentExercises.length > 0 ? (
          <section>
            <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">最近用過</h2>
            <ul className="grid gap-1">
              {recentExercises.map((exercise) => (
                <ExerciseRow key={`recent-${exercise.id}`} exercise={exercise} onPick={() => onPick(exercise)} />
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
            {filtered.length} 個動作
          </h2>
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">沒有符合的動作</p>
          ) : (
            <ul className="grid gap-1">
              {filtered.map((exercise) => (
                <ExerciseRow key={exercise.id} exercise={exercise} onPick={() => onPick(exercise)} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </Sheet>
  );
}

function ExerciseRow({ exercise, onPick }: { exercise: Exercise; onPick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left hover:bg-muted"
      >
        <span className="font-medium">{exercise.name}</span>
        <span className="text-xs text-muted-foreground">
          {MUSCLE_LABEL[exercise.muscleGroup]}
          {exercise.custom ? " · 自訂" : ""}
        </span>
      </button>
    </li>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-full px-3 text-sm",
        active ? "bg-foreground text-background" : "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}
