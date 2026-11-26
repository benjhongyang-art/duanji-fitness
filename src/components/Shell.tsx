import { Dumbbell, History, House, Settings, TrendingUp } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router";
import { Mark } from "@/components/Mark";
import { RestDock } from "@/components/RestDock";
import { useFitness } from "@/context/FitnessContext";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";
import { useNow } from "@/hooks/useNow";

const TABS = [
  { to: "/", label: "首頁", icon: House, end: true, testId: "nav-home" },
  { to: "/train", label: "訓練", icon: Dumbbell, end: false, testId: "nav-train" },
  { to: "/history", label: "紀錄", icon: History, end: false, testId: "nav-history" },
  { to: "/progress", label: "進度", icon: TrendingUp, end: false, testId: "nav-progress" },
  { to: "/settings", label: "設定", icon: Settings, end: false, testId: "nav-settings" },
] as const;

export function Shell() {
  const location = useLocation();
  const { activeSession, rest, toast } = useFitness();
  const focusMode = location.pathname === "/workout" || location.pathname.startsWith("/train/routine");
  const now = useNow(Boolean(activeSession) && !focusMode);
  const showBanner = Boolean(activeSession) && !focusMode && !rest;
  const elapsed = activeSession ? Math.max(0, Math.round((now - activeSession.startedAt) / 1000)) : 0;

  return (
    <div className="min-h-dvh bg-background text-foreground md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-card px-4 py-6 md:flex">
        <div className="flex items-center gap-2 px-2 text-primary">
          <Mark />
          <div>
            <p className="text-lg font-semibold tracking-tight text-foreground">鍛記</p>
            <p className="text-xs text-muted-foreground">訓練留在這台裝置</p>
          </div>
        </div>
        <nav className="mt-8 grid gap-1" aria-label="主要">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              data-testid={tab.testId}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted",
                )
              }
            >
              <tab.icon className="size-5" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <main
          id="main"
          className={cn(
            "mx-auto min-h-dvh w-full max-w-2xl",
            focusMode ? "pb-8" : "pb-24 md:pb-10",
            showBanner && "pb-40 md:pb-28",
            rest && (focusMode ? "pb-36" : "pb-52 md:pb-36"),
          )}
        >
          <Outlet />
        </main>
        {showBanner && activeSession ? (
          <NavLink
            to="/workout"
            className="fixed inset-x-0 z-30 mx-auto flex max-w-lg items-center justify-between rounded-full bg-foreground px-4 py-3 text-sm text-background shadow-lg bottom-[calc(4.4rem+env(safe-area-inset-bottom))] md:bottom-6 md:left-60 md:right-8 md:max-w-2xl"
          >
            <span className="font-medium">訓練進行中 · {activeSession.name}</span>
            <span className="tabular-nums">{formatClock(elapsed)}</span>
          </NavLink>
        ) : null}
        <RestDock focusMode={focusMode} />
        {toast ? (
          <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">
            {toast}
          </div>
        ) : null}
        {focusMode ? null : (
          <nav
            className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            aria-label="主要"
          >
            <div className="mx-auto flex max-w-lg">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  data-testid={`${tab.testId}-mobile`}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )
                  }
                >
                  <tab.icon className="size-5" strokeWidth={2} />
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
