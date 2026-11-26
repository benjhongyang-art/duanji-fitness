import { Link } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useFitness } from "@/context/FitnessContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { routineSummary, sortRoutines } from "@/lib/exercises";

export function TrainPage() {
  usePageTitle("訓練");
  const { routines } = useFitness();
  const starter = useStartWorkout();
  return (
    <div>
      <PageHeader
        kicker="課表"
        title="今天練什麼"
        action={
          <Button asChild size="sm">
            <Link to="/train/routine/new">新課表</Link>
          </Button>
        }
      />
      <div className="grid gap-3 px-4 pb-8">
        <Button data-testid="start-blank" size="lg" onClick={starter.startBlank}>
          不使用課表，直接開始
        </Button>
        {routines.length === 0 ? (
          <EmptyState title="還沒有課表" body="把常練的動作存成推、拉、腿，下次一個按鈕就能開練。" />
        ) : (
          sortRoutines(routines).map((routine) => (
              <article key={routine.id} className="rounded-3xl border border-border bg-card p-4">
                <h2 className="text-xl font-semibold">{routine.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{routineSummary(routine)}</p>
                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" onClick={() => starter.startRoutine(routine.id)}>
                    開始
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={`/train/routine/${routine.id}`}>編輯</Link>
                  </Button>
                </div>
              </article>
            ))
        )}
      </div>
      {starter.dialog}
    </div>
  );
}
