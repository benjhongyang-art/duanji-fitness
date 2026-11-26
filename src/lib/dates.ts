const TAIPEI = "Asia/Taipei";

export function formatDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TAIPEI,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDays(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) + days));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function weekdayIndex(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)).getUTCDay();
}

export function startOfWeekMonday(key: string): string {
  const weekday = weekdayIndex(key);
  const diff = weekday === 0 ? -6 : 1 - weekday;
  return addDays(key, diff);
}

export function daysBetween(start: string, end: string): number {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const a = Date.UTC(sy ?? 1970, (sm ?? 1) - 1, sd ?? 1);
  const b = Date.UTC(ey ?? 1970, (em ?? 1) - 1, ed ?? 1);
  return Math.round((b - a) / 86_400_000);
}

export function taipeiNoon(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 4, 0, 0);
}

export function taipeiHour(date: Date): number {
  const value = new Intl.DateTimeFormat("en-US", {
    timeZone: TAIPEI,
    hour: "numeric",
    hourCycle: "h23",
  }).format(date);
  return Number(value);
}

export const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const;

export const WEEKDAY_FULL = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"] as const;
