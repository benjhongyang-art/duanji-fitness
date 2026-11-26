import type { ThemeMode } from "./types.ts";

export const THEME_KEY = "duanji-theme";

export function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function isDarkTheme(theme: ThemeMode): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return prefersDark();
}

export function applyTheme(theme: ThemeMode): void {
  localStorage.setItem(THEME_KEY, theme);
  const dark = isDarkTheme(theme);
  document.documentElement.classList.toggle("dark", dark);
  document.getElementById("theme-color")?.setAttribute("content", dark ? "#100f0d" : "#f3f0e8");
}
