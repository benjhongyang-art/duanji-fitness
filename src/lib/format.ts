import { WEEKDAY_FULL, addDays, formatDateKey, taipeiHour, weekdayIndex } from "./dates.ts";

export function formatKg(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatSigned(value: number): string {
  const abs = formatKg(Math.abs(value));
  if (value > 0) return `+${abs}`;
  if (value < 0) return `−${abs}`;
  return "0";
}

export function volumeParts(kg: number): { value: string; unit: string } {
  if (kg >= 1000) {
    const tonnes = kg / 1000;
    const digits = tonnes >= 10 ? 1 : 2;
    return { value: tonnes.toFixed(digits), unit: "噸" };
  }
  return { value: String(Math.round(kg)), unit: "公斤" };
}

export function formatVolume(kg: number): string {
  const parts = volumeParts(kg);
  return `${parts.value} ${parts.unit}`;
}

export function formatClock(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDistance(km: number): string {
  const rounded = Math.round(km * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function shortLabel(key: string): string {
  const [, month, day] = key.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function formatTaiwanDate(key: string, todayKey?: string): string {
  const [year, month, day] = key.split("-");
  const weekday = WEEKDAY_FULL[weekdayIndex(key)] ?? "";
  const sameYear = !todayKey || todayKey.slice(0, 4) === year;
  const prefix = sameYear ? "" : `${year}年`;
  return `${prefix}${Number(month)}月${Number(day)}日 ${weekday}`;
}

export function relativeDayLabel(key: string, todayKey: string): string {
  if (key === todayKey) return "今天";
  if (key === addDays(todayKey, -1)) return "昨天";
  if (key === addDays(todayKey, 1)) return "明天";
  return formatTaiwanDate(key, todayKey);
}

export function defaultWorkoutName(date: Date): string {
  const key = formatDateKey(date);
  const [, month, day] = key.split("-");
  return `${Number(month)}月${Number(day)}日訓練`;
}

export function greeting(date: Date): string {
  const hour = taipeiHour(date);
  if (hour < 5) return "夜深了";
  if (hour < 11) return "早安";
  if (hour < 14) return "午安";
  if (hour < 18) return "下午好";
  return "晚安";
}

export function formatInput(value: number | null): string {
  if (value == null) return "";
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded);
}

export function parseNum(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "" || trimmed === ".") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 1000) / 1000;
}
