import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useFitness } from "@/context/FitnessContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatDateKey } from "@/lib/dates";
import { formatClock, formatDistance, formatKg, formatTaiwanDate, formatVolume } from "@/lib/format";
import { MUSCLE_LABEL } from "@/lib/exercises";
import { logMode } from "@/lib/session";
import { summarize } from "@/lib/stats";

export function HistoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sessions, deleteSession, notify } = useFitness();
  const session = sessions.find((item) => item.id === id);
  const [confirm, setConfirm] = useState(false);
  usePageTitle(session?.name ?? "紀錄");

  if (!session || session.finishedAt == null) {
    return (
      <div className="px-4 pt-16 text-center">
        <p className="font-medium">找不到這筆訓練</p>
        <Link to="/history" className="mt-3 inline-block text-sm text-primary">
          回紀錄
        </Link>
      </div>
    );
  }

  const summary = summarize(session);
  const dateKey = formatDateKey(new Date(session.finishedAt));

  return (
    <div>
      <header className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <Link to="/history" className="text-sm text-muted-foreground">
          紀錄
        </Link>
        <h1 className="mt-2 text-[1.7rem] font-semibold tracking-tight">{session.name}</h1>
        <p className="text-sm text-muted-foreground">{formatTaiwanDate(dateKey, formatDateKey(new Date()))}</p>
      </header>
      <div className="grid gap-3 px-4 pb-8">
        <div className="grid grid-cols-3 gap-2">
          <Cell label="時間" value={formatClock(summary.durationSec)} />
          <Cell label="組數" value={String(summary.setCount)} />
          <Cell label="容量" value={summary.volumeKg > 0 ? formatVolume(summary.volumeKg) : "自重"} />
        </div>
        {session.notes ? <p className="rounded-2xl bg-muted px-4 py-3 text-sm leading-relaxed">{session.notes}</p> : null}
        {session.exercises.map((exercise) => {
          const mode = logMode(exercise);
          const done = exercise.sets.filter((set) => set.completed);
          return (
            <section key={exercise.id} className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold">{exercise.name}</h2>
                <span className="text-xs text-muted-foreground">{MUSCLE_LABEL[exercise.muscleGroup]}</span>
              </div>
              {done.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">沒有完成的組</p>
              ) : (
                <ol className="mt-3 grid gap-2">
                  {done.map((set, index) => (
                    <li key={set.id} className="flex items-baseline justify-between text-sm tabular-nums">
                      <span className="text-muted-foreground">第 {index + 1} 組</span>
                      <span>
                        {mode === "strength"
                          ? (set.weightKg ?? 0) > 0
                            ? `${formatKg(set.weightKg ?? 0)} 公斤 × ${set.reps ?? 0}`
                            : `${set.reps ?? 0} 次`
                          : [
                              (set.durationSec ?? 0) > 0 ? formatClock(set.durationSec ?? 0) : null,
                              mode === "cardio" && (set.distanceKm ?? 0) > 0 ? `${formatDistance(set.distanceKm ?? 0)} 公里` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })}
        <Button variant="ghost" className="text-destructive" onClick={() => setConfirm(true)}>
          刪除這筆訓練
        </Button>
      </div>
      <Sheet open={confirm} onOpenChange={setConfirm} title="刪除這筆訓練？" description="刪了就不會算進連續天數和曲線。">
        <Button
          variant="destructive"
          onClick={() => {
            void deleteSession(session.id).then(() => {
              notify("已刪除");
              navigate("/history");
            });
          }}
        >
          刪除
        </Button>
      </Sheet>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted px-2 py-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
