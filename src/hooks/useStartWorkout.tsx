import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useFitness } from "@/context/FitnessContext";

export function useStartWorkout() {
  const navigate = useNavigate();
  const { startBlank, startRoutine, discardActive, notify } = useFitness();
  const [pending, setPending] = useState<null | { type: "blank" } | { type: "routine"; id: string }>(null);

  async function go(next: { type: "blank" } | { type: "routine"; id: string }) {
    const result = next.type === "blank" ? await startBlank() : await startRoutine(next.id);
    if (result.ok) {
      navigate("/workout");
      return;
    }
    if (result.reason === "active") {
      setPending(next);
      return;
    }
    notify(result.reason === "missing" ? "找不到這份課表" : "無法開始訓練");
  }

  const dialog = (
    <Sheet
      open={pending != null}
      onOpenChange={(open) => {
        if (!open) setPending(null);
      }}
      title="還有一堂沒練完"
      description="進行中的訓練會留著。要繼續，還是放棄後重開？"
    >
      <div className="grid gap-2">
        <Button
          onClick={() => {
            setPending(null);
            navigate("/workout");
          }}
        >
          繼續那一堂
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            const next = pending;
            setPending(null);
            if (!next) return;
            void (async () => {
              await discardActive();
              const result = next.type === "blank" ? await startBlank() : await startRoutine(next.id);
              if (result.ok) navigate("/workout");
              else notify("無法開始訓練");
            })();
          }}
        >
          放棄並開始新的
        </Button>
      </div>
    </Sheet>
  );

  return {
    startBlank: () => void go({ type: "blank" }),
    startRoutine: (id: string) => void go({ type: "routine", id }),
    dialog,
  };
}
