import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { useFitness } from "@/context/FitnessContext";
import { formatDateKey } from "@/lib/dates";
import { parseNum } from "@/lib/format";
import { uid } from "@/lib/ids";
import type { BodyMetric } from "@/lib/types";

export function MetricDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: BodyMetric | null;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "修改體重" : "記錄體重"}
      description="同一天再記一次，會覆蓋那天的數字。"
    >
      {open ? (
        <MetricForm
          key={`${initial?.id ?? "new"}-${initial?.date ?? ""}`}
          initial={initial}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Sheet>
  );
}

function MetricForm({ initial, onClose }: { initial?: BodyMetric | null; onClose: () => void }) {
  const { saveMetric, notify } = useFitness();
  const today = formatDateKey(new Date());
  const [date, setDate] = useState(initial?.date ?? today);
  const [weight, setWeight] = useState(initial ? String(initial.weightKg) : "");
  const [fat, setFat] = useState(initial?.bodyFatPct != null ? String(initial.bodyFatPct) : "");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const weightKg = parseNum(weight);
    if (weightKg == null || weightKg < 20 || weightKg > 400) {
      setError("體重請填 20 到 400 公斤");
      return;
    }
    const bodyFat = fat.trim() === "" ? null : parseNum(fat);
    if (fat.trim() !== "" && (bodyFat == null || bodyFat <= 2 || bodyFat >= 70)) {
      setError("體脂請填 3 到 69%，或留空");
      return;
    }
    const metric: BodyMetric = {
      id: initial?.id ?? uid(),
      date,
      weightKg,
      bodyFatPct: bodyFat,
      createdAt: Date.now(),
    };
    await saveMetric(metric);
    notify("已記下體重");
    onClose();
  }

  return (
    <form className="grid gap-3" onSubmit={(event) => void onSubmit(event)}>
      <div className="grid gap-1.5">
        <Label htmlFor="metric-date">日期</Label>
        <Input id="metric-date" type="date" max={today} value={date} onChange={(event) => setDate(event.target.value)} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="metric-weight">體重（公斤）</Label>
        <Input
          id="metric-weight"
          inputMode="decimal"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          placeholder="72.4"
          data-testid="metric-weight"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="metric-fat">體脂 %（可空白）</Label>
        <Input
          id="metric-fat"
          inputMode="decimal"
          value={fat}
          onChange={(event) => setFat(event.target.value)}
          placeholder="21.5"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit">儲存</Button>
    </form>
  );
}
