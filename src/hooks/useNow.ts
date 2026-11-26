import { useEffect, useState } from "react";

export function useNow(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const update = () => setNow(Date.now());
    update();
    const id = window.setInterval(update, intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);
  return now;
}
