import { Link } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useFitness } from "@/context/FitnessContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatDateKey } from "@/lib/dates";
import { formatVolume, relativeDayLabel } from "@/lib/format";
import { groupByMonth, summarize } from "@/lib/stats";

export function HistoryPage() {
  usePageTitle("紀錄");
  const { sessions } = useFitness();
  const groups = groupByMonth(sessions);
  const todayKey = formatDateKey(new Date());
  return (
    <div>
      <PageHeader kicker="練過的" title="紀錄" />
      <div className="grid gap-6 px-4 pb-8">
        {groups.length === 0 ? (
          <EmptyState title="完成的訓練會出現在這裡" body="進行中的那一堂要按完成，才會算進紀錄、連續天數和進步曲線。" />
        ) : (
          groups.map((group) => (
            <section key={group.key} className="grid gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">{group.label}</h2>
              {group.items.map((session) => {
                const summary = summarize(session);
                const key = formatDateKey(new Date(session.finishedAt!));
                return (
                  <Link key={session.id} to={`/history/${session.id}`} className="rounded-3xl border border-border bg-card px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-semibold">{session.name}</h3>
                      <span className="text-sm text-muted-foreground">{relativeDayLabel(key, todayKey)}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {session.exercises.map((exercise) => exercise.name).join("、") || "沒有動作"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {summary.setCount} 組
                      {summary.volumeKg > 0 ? ` · ${formatVolume(summary.volumeKg)}` : " · 自重"} · {Math.max(1, Math.round(summary.durationSec / 60))} 分
                    </p>
                  </Link>
                );
              })}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
