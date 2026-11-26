import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ExercisePicker } from "@/components/ExercisePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useFitness } from "@/context/FitnessContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { MUSCLE_LABEL } from "@/lib/exercises";
import { uid } from "@/lib/ids";
import type { Exercise, Routine, RoutineExercise } from "@/lib/types";

export function RoutinePage() {
  const { id } = useParams();
  const creating = !id || id === "new";
  const navigate = useNavigate();
  const { routines, saveRoutine, deleteRoutine, notify } = useFitness();
  const existing = creating ? undefined : routines.find((routine) => routine.id === id);
  usePageTitle(creating ? "新課表" : "編輯課表");
  const [name, setName] = useState(existing?.name ?? "");
  const [exercises, setExercises] = useState<RoutineExercise[]>(existing?.exercises ?? []);
  const [picker, setPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!creating && !existing) {
    return (
      <div className="px-4 pt-16 text-center">
        <p className="font-medium">找不到這份課表</p>
        <Link to="/train" className="mt-3 inline-block text-sm text-primary">
          回訓練
        </Link>
      </div>
    );
  }

  function addExercise(exercise: Exercise) {
    const row: RoutineExercise = {
      id: uid(),
      exerciseId: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      kind: exercise.kind,
      timed: exercise.timed,
    };
    setExercises((prev) => [...prev, row]);
    setPicker(false);
  }

  function move(index: number, direction: -1 | 1) {
    setExercises((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = prev.slice();
      const [item] = copy.splice(index, 1);
      if (!item) return prev;
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  }

  async function save() {
    if (!name.trim()) {
      notify("先給課表一個名字");
      return;
    }
    if (exercises.length === 0) {
      notify("至少加入一個動作");
      return;
    }
    const routine: Routine = {
      id: creating ? uid() : existing!.id,
      name: name.trim(),
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      exercises,
    };
    await saveRoutine(routine);
    notify("課表已儲存");
    navigate("/train");
  }

  return (
    <div>
      <header className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <Link to="/train" className="text-sm text-muted-foreground">
          取消
        </Link>
        <h1 className="text-base font-semibold">{creating ? "新課表" : "編輯課表"}</h1>
        <button type="button" className="text-sm font-medium text-primary" onClick={() => void save()}>
          儲存
        </button>
      </header>
      <div className="grid gap-3 px-4 pb-8">
        <Input aria-label="課表名稱" value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：推" maxLength={24} />
        {exercises.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            把這堂課會練的動作加進來，順序就是上場的順序。
          </p>
        ) : (
          <ol className="grid gap-2">
            {exercises.map((exercise, index) => (
              <li key={exercise.id} className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{exercise.name}</p>
                  <p className="text-xs text-muted-foreground">{MUSCLE_LABEL[exercise.muscleGroup]}</p>
                </div>
                <button type="button" aria-label="上移" disabled={index === 0} className="grid size-9 place-items-center disabled:opacity-30" onClick={() => move(index, -1)}>
                  <ChevronUp className="size-4" />
                </button>
                <button type="button" aria-label="下移" disabled={index === exercises.length - 1} className="grid size-9 place-items-center disabled:opacity-30" onClick={() => move(index, 1)}>
                  <ChevronDown className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`移除${exercise.name}`}
                  className="grid size-9 place-items-center text-muted-foreground"
                  onClick={() => setExercises((prev) => prev.filter((item) => item.id !== exercise.id))}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ol>
        )}
        <Button variant="outline" onClick={() => setPicker(true)}>
          新增動作
        </Button>
        {!creating ? (
          <Button variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
            刪除課表
          </Button>
        ) : null}
      </div>
      <ExercisePicker open={picker} onOpenChange={setPicker} onPick={addExercise} />
      <Sheet open={confirmDelete} onOpenChange={setConfirmDelete} title="刪除這份課表？" description="已完成的訓練不會一起刪掉。">
        <Button
          variant="destructive"
          onClick={() => {
            if (!existing) return;
            void deleteRoutine(existing.id).then(() => {
              notify("已刪除課表");
              navigate("/train");
            });
          }}
        >
          刪除
        </Button>
      </Sheet>
    </div>
  );
}
