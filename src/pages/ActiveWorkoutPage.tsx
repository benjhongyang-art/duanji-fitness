import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ExerciseBlock } from "@/components/ExerciseBlock";
import { ExercisePicker } from "@/components/ExercisePicker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useFitness } from "@/context/FitnessContext";
import { useNow } from "@/hooks/useNow";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatClock, formatVolume } from "@/lib/format";
import { uid } from "@/lib/ids";
import { canComplete, emptySet, logMode, sessionExerciseFromLibrary } from "@/lib/session";
import { lastCompletedSets, summarize } from "@/lib/stats";
import type { Exercise, WorkoutSet } from "@/lib/types";

export function ActiveWorkoutPage() {
  usePageTitle("訓練中");
  const navigate = useNavigate();
  const { activeSession, sessions, settings, updateActive, getActive, finishActive, discardActive, startRest, notify } = useFitness();
  const now = useNow(Boolean(activeSession));
  const [picker, setPicker] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  if (!activeSession) {
    return (
      <div className="px-4 pt-20 text-center">
        <p className="text-lg font-semibold">沒有進行中的訓練</p>
        <p className="mt-2 text-sm text-muted-foreground">開始一堂之後，組數會留在這台裝置，重新整理也不會消失。</p>
        <Button asChild className="mt-5">
          <Link to="/train">去訓練</Link>
        </Button>
      </div>
    );
  }

  const summary = summarize(activeSession, now);
  const elapsed = Math.max(0, Math.round((now - activeSession.startedAt) / 1000));

  function patchSet(exerciseId: string, setId: string, patch: Partial<WorkoutSet>) {
    updateActive((session) => ({
      ...session,
      exercises: session.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, sets: exercise.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)) }
          : exercise,
      ),
    }));
  }

  function toggleSet(exerciseId: string, setId: string) {
    const current = getActive();
    const block = current?.exercises.find((exercise) => exercise.id === exerciseId);
    const set = block?.sets.find((item) => item.id === setId);
    if (!block || !set || !current) return;
    if (!set.completed && !canComplete(block, set)) {
      notify(logMode(block) === "strength" ? "先填好次數" : "先填時間或距離");
      return;
    }
    const willComplete = !set.completed;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    updateActive((session) => ({
      ...session,
      exercises: session.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const sets = exercise.sets.map((item) => (item.id === setId ? { ...item, completed: willComplete } : item));
        if (willComplete && sets.length < 30 && sets.at(-1)?.id === setId) {
          const done = sets.at(-1);
          if (done) {
            sets.push({
              id: uid(),
              weightKg: done.weightKg,
              reps: done.reps,
              durationSec: done.durationSec,
              distanceKm: done.distanceKm,
              completed: false,
            });
          }
        }
        return { ...exercise, sets };
      }),
    }));
    if (willComplete && settings.restEnabled) {
      startRest();
      navigator.vibrate?.(12);
    }
  }

  function addExercise(exercise: Exercise) {
    updateActive((session) => ({
      ...session,
      exercises: [...session.exercises, sessionExerciseFromLibrary(exercise)],
    }));
    setPicker(false);
  }

  async function save() {
    const finished = await finishActive();
    if (!finished) return;
    notify("訓練已儲存");
    navigate(`/history/${finished.id}`, { replace: true });
  }

  return (
    <div>
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-background/90 px-4 py-3 backdrop-blur pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to="/train" className="text-sm text-muted-foreground">
          離開
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <input
            aria-label="訓練名稱"
            value={activeSession.name}
            onChange={(event) => updateActive((session) => ({ ...session, name: event.target.value }))}
            className="w-full bg-transparent text-center text-base font-semibold outline-none"
          />
          <p className="text-xs tabular-nums text-muted-foreground">{formatClock(elapsed)}</p>
        </div>
        <button type="button" className="text-sm text-muted-foreground" onClick={() => startRest()}>
          休息
        </button>
        <button
          type="button"
          data-testid="finish-workout"
          className="text-sm font-semibold text-primary"
          onClick={() => setConfirmFinish(true)}
        >
          完成
        </button>
      </header>
      <div className="grid gap-3 px-4 pb-8">
        {activeSession.exercises.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            先加入今天要練的動作。離開這個畫面，訓練也會留著。
          </p>
        ) : (
          activeSession.exercises.map((block, index) => (
            <ExerciseBlock
              key={block.id}
              block={block}
              previous={lastCompletedSets(sessions, block.exerciseId, activeSession.id)}
              canMoveUp={index > 0}
              canMoveDown={index < activeSession.exercises.length - 1}
              onPatch={(setId, patch) => patchSet(block.id, setId, patch)}
              onToggle={(setId) => toggleSet(block.id, setId)}
              onAddSet={() =>
                updateActive((session) => ({
                  ...session,
                  exercises: session.exercises.map((exercise) => {
                    if (exercise.id !== block.id) return exercise;
                    const last = exercise.sets.at(-1);
                    return {
                      ...exercise,
                      sets: [
                        ...exercise.sets,
                        {
                          ...(last ? { ...emptySet(), weightKg: last.weightKg, reps: last.reps, durationSec: last.durationSec, distanceKm: last.distanceKm } : emptySet()),
                        },
                      ],
                    };
                  }),
                }))
              }
              onRemoveSet={(setId) =>
                updateActive((session) => ({
                  ...session,
                  exercises: session.exercises.map((exercise) =>
                    exercise.id === block.id ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) } : exercise,
                  ),
                }))
              }
              onRemove={() =>
                updateActive((session) => ({
                  ...session,
                  exercises: session.exercises.filter((exercise) => exercise.id !== block.id),
                }))
              }
              onMove={(direction) =>
                updateActive((session) => {
                  const nextIndex = index + direction;
                  if (nextIndex < 0 || nextIndex >= session.exercises.length) return session;
                  const copy = session.exercises.slice();
                  const [item] = copy.splice(index, 1);
                  if (!item) return session;
                  copy.splice(nextIndex, 0, item);
                  return { ...session, exercises: copy };
                })
              }
              onFillPrevious={() => {
                const previous = lastCompletedSets(sessions, block.exerciseId, activeSession.id);
                if (!previous) return;
                updateActive((session) => ({
                  ...session,
                  exercises: session.exercises.map((exercise) =>
                    exercise.id === block.id
                      ? {
                          ...exercise,
                          sets: previous.map((set) => ({
                            id: uid(),
                            weightKg: set.weightKg,
                            reps: set.reps,
                            durationSec: set.durationSec,
                            distanceKm: set.distanceKm,
                            completed: false,
                          })),
                        }
                      : exercise,
                  ),
                }));
              }}
            />
          ))
        )}
        <Button data-testid="add-exercise" variant="outline" onClick={() => setPicker(true)}>
          新增動作
        </Button>
        <Textarea
          aria-label="訓練備註"
          placeholder="今天的備註，例如：右手肘有點緊"
          value={activeSession.notes}
          onChange={(event) => updateActive((session) => ({ ...session, notes: event.target.value }))}
        />
        <button type="button" className="py-2 text-sm text-destructive" onClick={() => setConfirmDiscard(true)}>
          放棄這次訓練
        </button>
      </div>
      <ExercisePicker open={picker} onOpenChange={setPicker} onPick={addExercise} />
      <Sheet
        open={confirmFinish}
        onOpenChange={setConfirmFinish}
        title={summary.setCount === 0 ? "還沒有完成的組數" : "儲存這次訓練？"}
        description={activeSession.name}
      >
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <Summary label="時間" value={formatClock(summary.durationSec)} />
          <Summary label="組數" value={String(summary.setCount)} />
          <Summary label="容量" value={summary.volumeKg > 0 ? formatVolume(summary.volumeKg) : "—"} />
        </div>
        {summary.setCount === 0 ? (
          <div className="grid gap-2">
            <Button onClick={() => setConfirmFinish(false)}>繼續練</Button>
            <Button
              variant="destructive"
              onClick={() => {
                void discardActive().then(() => navigate("/train", { replace: true }));
              }}
            >
              放棄這次
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            <Button onClick={() => void save()}>儲存</Button>
            <Button variant="outline" onClick={() => setConfirmFinish(false)}>
              返回
            </Button>
          </div>
        )}
      </Sheet>
      <Sheet open={confirmDiscard} onOpenChange={setConfirmDiscard} title="放棄這次訓練？" description="已輸入的組數會刪掉。">
        <Button
          variant="destructive"
          onClick={() => {
            void discardActive().then(() => navigate("/train", { replace: true }));
          }}
        >
          放棄
        </Button>
      </Sheet>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted px-2 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
