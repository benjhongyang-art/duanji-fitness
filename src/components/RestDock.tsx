import { useEffect, useState } from "react";
import { useFitness } from "@/context/FitnessContext";
import { formatClock } from "@/lib/format";
import { chime } from "@/lib/sound";

export function RestDock({ focusMode }: { focusMode: boolean }) {
  const { rest, adjustRest, stopRest } = useFitness();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!rest) return;
    const id = window.setInterval(() => setTick((value) => value + 1), 200);
    return () => window.clearInterval(id);
  }, [rest]);

  // tick 只負責重畫；秒數每次都以現在的時間計算，避免沿用舊的時鐘。
  const now = Date.now();
  void tick;

  useEffect(() => {
    if (!rest) return;
    const delay = Math.max(0, rest.endsAt - Date.now());
    let dismiss = 0;
    const timer = window.setTimeout(() => {
      const marker = `duanji-rest-chime:${rest.endsAt}`;
      if (!sessionStorage.getItem(marker)) {
        sessionStorage.setItem(marker, "1");
        chime();
        navigator.vibrate?.([30, 50, 30]);
      }
      dismiss = window.setTimeout(() => stopRest(), 1400);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(dismiss);
    };
  }, [rest, stopRest]);

  if (!rest) return null;
  const remainingMs = Math.max(0, rest.endsAt - now);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const fraction = Math.max(0, Math.min(1, remainingMs / (rest.totalSec * 1000)));
  const done = remainingMs <= 0;

  return (
    <div
      className={
        focusMode
          ? "fixed inset-x-0 z-40 px-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] md:bottom-6 md:left-60"
          : "fixed inset-x-0 z-40 px-3 bottom-[calc(4.2rem+env(safe-area-inset-bottom))] md:bottom-6 md:left-60"
      }
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-3xl bg-foreground px-3 py-2 text-background shadow-lg">
        <div
          className="grid size-12 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--primary) ${fraction * 360}deg, color-mix(in srgb, var(--background) 35%, transparent) 0)`,
          }}
          aria-hidden
        >
          <div className="size-9 rounded-full bg-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs opacity-70">{done ? "休息結束" : "組間休息"}</p>
          <p className="text-lg font-semibold tabular-nums">{done ? "00:00" : formatClock(remainingSec)}</p>
        </div>
        <button type="button" className="h-10 rounded-full px-3 text-sm font-medium" onClick={() => adjustRest(15)}>
          +15
        </button>
        <button type="button" className="h-10 rounded-full bg-background/15 px-3 text-sm font-medium" onClick={stopRest}>
          跳過
        </button>
      </div>
    </div>
  );
}
