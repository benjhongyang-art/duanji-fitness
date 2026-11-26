import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  deleteMetricRecord,
  deleteRoutineRecord,
  deleteSessionRecord,
  loadApp,
  putCustomExercise,
  putMetric,
  putRoutine,
  putSession,
  putSettings,
  replaceAll,
} from "../lib/db.ts";
import { defaultRoutines } from "../lib/exercises.ts";
import { defaultWorkoutName } from "../lib/format.ts";
import { uid } from "../lib/ids.ts";
import { buildSample } from "../lib/sample.ts";
import { exercisesFromRoutine } from "../lib/session.ts";
import { activeSessionOf } from "../lib/stats.ts";
import { applyTheme } from "../lib/theme.ts";
import { primeAudio } from "../lib/sound.ts";
import { DEFAULT_SETTINGS } from "../lib/types.ts";
import type { AppData, AppSettings, BodyMetric, Exercise, Routine, WorkoutSession } from "../lib/types.ts";

export interface RestState {
  endsAt: number;
  totalSec: number;
}

const REST_KEY = "duanji-rest";

function readRest(): RestState | null {
  try {
    const raw = sessionStorage.getItem(REST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RestState;
    if (!parsed.endsAt || parsed.endsAt <= Date.now()) {
      sessionStorage.removeItem(REST_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function storeRest(rest: RestState | null) {
  if (!rest) sessionStorage.removeItem(REST_KEY);
  else sessionStorage.setItem(REST_KEY, JSON.stringify(rest));
}

export type StartResult = { ok: true } | { ok: false; reason: "active" | "missing" | "save" };

interface FitnessContextValue {
  ready: boolean;
  error: string | null;
  sessions: WorkoutSession[];
  routines: Routine[];
  metrics: BodyMetric[];
  customExercises: Exercise[];
  settings: AppSettings;
  activeSession: WorkoutSession | null;
  rest: RestState | null;
  toast: string | null;
  notify: (message: string) => void;
  dismissToast: () => void;
  startRest: (seconds?: number) => void;
  adjustRest: (deltaSec: number) => void;
  stopRest: () => void;
  startBlank: () => Promise<StartResult>;
  startRoutine: (routineId: string) => Promise<StartResult>;
  discardActive: () => Promise<void>;
  updateActive: (recipe: (session: WorkoutSession) => WorkoutSession) => void;
  getActive: () => WorkoutSession | null;
  finishActive: () => Promise<WorkoutSession | null>;
  deleteSession: (id: string) => Promise<void>;
  saveRoutine: (routine: Routine) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  saveMetric: (metric: BodyMetric) => Promise<void>;
  deleteMetric: (id: string) => Promise<void>;
  addCustomExercise: (exercise: Exercise) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  exportData: () => AppData;
  importData: (data: AppData) => Promise<void>;
  loadSample: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const FitnessContext = createContext<FitnessContextValue | null>(null);

export function FitnessProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [rest, setRest] = useState<RestState | null>(() => readRest());
  const [toast, setToast] = useState<string | null>(null);
  const activeRef = useRef<WorkoutSession | null>(null);
  const settingsRef = useRef(settings);
  const routinesRef = useRef(routines);
  const dataRef = useRef({ sessions, routines, metrics, customExercises, settings });
  const persistTimer = useRef<number | null>(null);

  settingsRef.current = settings;
  routinesRef.current = routines;
  dataRef.current = { sessions, routines, metrics, customExercises, settings };

  const notify = useCallback((message: string) => setToast(message), []);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    loadApp()
      .then((data) => {
        if (cancelled) return;
        setSessions(data.sessions);
        setRoutines(data.routines);
        setMetrics(data.metrics);
        setCustomExercises(data.customExercises);
        setSettings(data.settings);
        activeRef.current = activeSessionOf(data.sessions);
        applyTheme(data.settings.theme);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError("無法開啟這台裝置上的資料庫。請確認瀏覽器沒有封鎖網站資料。");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (settings.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [settings.theme]);

  useEffect(() => {
    return () => {
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
      const current = activeRef.current;
      if (current) void putSession(current);
    };
  }, []);

  const activeSession = activeSessionOf(sessions);

  const schedulePersist = useCallback((session: WorkoutSession) => {
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      void putSession(session).catch(() => setToast("訓練沒有存成功，請再試一次"));
    }, 250);
  }, []);

  const getActive = useCallback(() => activeRef.current, []);

  const updateActive = useCallback(
    (recipe: (session: WorkoutSession) => WorkoutSession) => {
      const current = activeRef.current;
      if (!current || current.finishedAt != null) return;
      const next = recipe(current);
      activeRef.current = next;
      setSessions((prev) => prev.map((session) => (session.id === next.id ? next : session)));
      schedulePersist(next);
    },
    [schedulePersist],
  );

  const insertSession = useCallback(async (session: WorkoutSession): Promise<StartResult> => {
    if (activeRef.current && activeRef.current.finishedAt == null) return { ok: false, reason: "active" };
    activeRef.current = session;
    setSessions((prev) => [...prev, session]);
    try {
      await putSession(session);
      return { ok: true };
    } catch {
      activeRef.current = null;
      setSessions((prev) => prev.filter((item) => item.id !== session.id));
      setToast("無法開始訓練");
      return { ok: false, reason: "save" };
    }
  }, []);

  const startBlank = useCallback(async (): Promise<StartResult> => {
    const now = Date.now();
    return insertSession({
      id: uid(),
      name: defaultWorkoutName(new Date(now)),
      startedAt: now,
      finishedAt: null,
      notes: "",
      routineId: null,
      exercises: [],
    });
  }, [insertSession]);

  const startRoutine = useCallback(
    async (routineId: string): Promise<StartResult> => {
      const routine = routinesRef.current.find((item) => item.id === routineId);
      if (!routine) return { ok: false, reason: "missing" };
      const now = Date.now();
      return insertSession({
        id: uid(),
        name: routine.name,
        startedAt: now,
        finishedAt: null,
        notes: "",
        routineId: routine.id,
        exercises: exercisesFromRoutine(routine),
      });
    },
    [insertSession],
  );

  const discardActive = useCallback(async () => {
    setRest(null);
    storeRest(null);
    const current = activeRef.current;
    if (!current) return;
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    activeRef.current = null;
    setSessions((prev) => prev.filter((session) => session.id !== current.id));
    await deleteSessionRecord(current.id);
  }, []);

  const finishActive = useCallback(async () => {
    setRest(null);
    storeRest(null);
    const current = activeRef.current;
    if (!current) return null;
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    const finished: WorkoutSession = {
      ...current,
      name: current.name.trim() || defaultWorkoutName(new Date(current.startedAt)),
      finishedAt: Date.now(),
    };
    activeRef.current = null;
    setSessions((prev) => prev.map((session) => (session.id === finished.id ? finished : session)));
    await putSession(finished);
    return finished;
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    if (activeRef.current?.id === id) activeRef.current = null;
    setSessions((prev) => prev.filter((session) => session.id !== id));
    await deleteSessionRecord(id);
  }, []);

  const saveRoutine = useCallback(async (routine: Routine) => {
    setRoutines((prev) => {
      const exists = prev.some((item) => item.id === routine.id);
      return exists ? prev.map((item) => (item.id === routine.id ? routine : item)) : [...prev, routine];
    });
    await putRoutine(routine);
  }, []);

  const deleteRoutine = useCallback(async (id: string) => {
    setRoutines((prev) => prev.filter((routine) => routine.id !== id));
    await deleteRoutineRecord(id);
  }, []);

  const saveMetric = useCallback(async (metric: BodyMetric) => {
    const previous = dataRef.current.metrics;
    const removed = previous.filter((item) => (item.date === metric.date || item.id === metric.id) && item.id !== metric.id);
    setMetrics([...previous.filter((item) => item.date !== metric.date && item.id !== metric.id), metric].sort((a, b) => a.date.localeCompare(b.date)));
    await Promise.all(removed.map((item) => deleteMetricRecord(item.id)));
    await putMetric(metric);
  }, []);

  const deleteMetric = useCallback(async (id: string) => {
    setMetrics((prev) => prev.filter((metric) => metric.id !== id));
    await deleteMetricRecord(id);
  }, []);

  const addCustomExercise = useCallback(async (exercise: Exercise) => {
    setCustomExercises((prev) => [...prev.filter((item) => item.id !== exercise.id), exercise]);
    await putCustomExercise(exercise);
  }, []);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = { ...settingsRef.current, ...patch };
    setSettings(next);
    if (patch.theme) applyTheme(next.theme);
    await putSettings(next);
  }, []);

  const applyData = useCallback((data: AppData) => {
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    activeRef.current = activeSessionOf(data.sessions);
    setSessions(data.sessions);
    setRoutines(data.routines);
    setMetrics(data.metrics);
    setCustomExercises(data.customExercises);
    setSettings(data.settings);
    applyTheme(data.settings.theme);
  }, []);

  const exportData = useCallback((): AppData => dataRef.current, []);

  const importData = useCallback(
    async (data: AppData) => {
      await replaceAll(data);
      applyData(data);
    },
    [applyData],
  );

  const loadSample = useCallback(async () => {
    const sample = buildSample(new Date());
    const next: AppData = { ...sample, settings: { ...settingsRef.current, seeded: true } };
    await replaceAll(next);
    applyData(next);
  }, [applyData]);

  const clearAll = useCallback(async () => {
    const next: AppData = {
      sessions: [],
      routines: defaultRoutines(),
      metrics: [],
      customExercises: [],
      settings: { ...settingsRef.current, seeded: true },
    };
    await replaceAll(next);
    applyData(next);
  }, [applyData]);

  const startRest = useCallback((seconds?: number) => {
    primeAudio();
    const total = seconds ?? settingsRef.current.restSec;
    const next = { endsAt: Date.now() + total * 1000, totalSec: total };
    setRest(next);
    storeRest(next);
  }, []);

  const adjustRest = useCallback((deltaSec: number) => {
    setRest((prev) => {
      if (!prev) return prev;
      const endsAt = Math.max(Date.now() + 1000, prev.endsAt + deltaSec * 1000);
      const next = { endsAt, totalSec: Math.max(15, prev.totalSec + deltaSec) };
      storeRest(next);
      return next;
    });
  }, []);

  const stopRest = useCallback(() => {
    setRest(null);
    storeRest(null);
  }, []);

  const value = useMemo<FitnessContextValue>(
    () => ({
      ready,
      error,
      sessions,
      routines,
      metrics,
      customExercises,
      settings,
      activeSession,
      rest,
      toast,
      notify,
      dismissToast,
      startRest,
      adjustRest,
      stopRest,
      startBlank,
      startRoutine,
      discardActive,
      updateActive,
      getActive,
      finishActive,
      deleteSession,
      saveRoutine,
      deleteRoutine,
      saveMetric,
      deleteMetric,
      addCustomExercise,
      updateSettings,
      exportData,
      importData,
      loadSample,
      clearAll,
    }),
    [
      ready,
      error,
      sessions,
      routines,
      metrics,
      customExercises,
      settings,
      activeSession,
      rest,
      toast,
      notify,
      dismissToast,
      startRest,
      adjustRest,
      stopRest,
      startBlank,
      startRoutine,
      discardActive,
      updateActive,
      getActive,
      finishActive,
      deleteSession,
      saveRoutine,
      deleteRoutine,
      saveMetric,
      deleteMetric,
      addCustomExercise,
      updateSettings,
      exportData,
      importData,
      loadSample,
      clearAll,
    ],
  );

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-6 text-center text-foreground">
        <div className="max-w-sm">
          <p className="text-lg font-semibold">資料庫開不了</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            className="mt-5 h-11 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            重新整理
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-foreground">
        <div className="text-center">
          <p className="text-2xl font-semibold tracking-tight">鍛記</p>
          <p className="mt-2 text-sm text-muted-foreground">正在打開這台裝置上的紀錄</p>
        </div>
      </div>
    );
  }

  return <FitnessContext.Provider value={value}>{children}</FitnessContext.Provider>;
}

export function useFitness(): FitnessContextValue {
  const value = useContext(FitnessContext);
  if (!value) throw new Error("useFitness 必須在 FitnessProvider 裡使用");
  return value;
}
