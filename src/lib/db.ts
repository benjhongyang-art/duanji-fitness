import { openDB, type IDBPDatabase } from "idb";
import { defaultRoutines } from "./exercises.ts";
import { DEFAULT_SETTINGS } from "./types.ts";
import type { AppData, AppSettings, BodyMetric, Exercise, Routine, SettingsRecord, ThemeMode, WorkoutSession } from "./types.ts";

interface DuanjiSchema {
  sessions: { key: string; value: WorkoutSession };
  routines: { key: string; value: Routine };
  metrics: { key: string; value: BodyMetric };
  customExercises: { key: string; value: Exercise };
  meta: { key: string; value: SettingsRecord };
}

const DB_NAME = "duanji";
const DB_VERSION = 1;

let database: Promise<IDBPDatabase<DuanjiSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<DuanjiSchema>> {
  if (!database) {
    database = openDB<DuanjiSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("sessions")) db.createObjectStore("sessions", { keyPath: "id" });
        if (!db.objectStoreNames.contains("routines")) db.createObjectStore("routines", { keyPath: "id" });
        if (!db.objectStoreNames.contains("metrics")) db.createObjectStore("metrics", { keyPath: "id" });
        if (!db.objectStoreNames.contains("customExercises")) {
          db.createObjectStore("customExercises", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
      },
    });
  }
  return database;
}

// Writes share one chain so a debounced save cannot land after a newer finish.
let chain: Promise<unknown> = Promise.resolve();

function write<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function isTheme(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function toSettings(record: SettingsRecord | undefined): AppSettings {
  return {
    theme: record && isTheme(record.theme) ? record.theme : "system",
    restSec: record && record.restSec >= 15 ? record.restSec : DEFAULT_SETTINGS.restSec,
    restEnabled: record?.restEnabled ?? true,
    seeded: record?.seeded ?? false,
  };
}

async function ensureSeed(db: IDBPDatabase<DuanjiSchema>): Promise<AppSettings> {
  const existing = await db.get("meta", "settings");
  if (existing?.seeded) return toSettings(existing);
  const settings: SettingsRecord = { ...toSettings(existing), key: "settings", seeded: true };
  const tx = db.transaction(["routines", "meta"], "readwrite");
  for (const routine of defaultRoutines()) {
    await tx.objectStore("routines").put(routine);
  }
  await tx.objectStore("meta").put(settings);
  await tx.done;
  return settings;
}

async function loadAppOnce(): Promise<AppData> {
  const db = await getDB();
  const settings = await ensureSeed(db);
  let sessions = await db.getAll("sessions");
  const open = sessions.filter((session) => session.finishedAt == null).sort((a, b) => b.startedAt - a.startedAt);
  if (open.length > 1) {
    const extras = open.slice(1);
    await Promise.all(extras.map((session) => db.delete("sessions", session.id)));
    const drop = new Set(extras.map((session) => session.id));
    sessions = sessions.filter((session) => !drop.has(session.id));
  }
  const [routines, metrics, customExercises] = await Promise.all([
    db.getAll("routines"),
    db.getAll("metrics"),
    db.getAll("customExercises"),
  ]);
  return { sessions, routines, metrics, customExercises, settings };
}

let loaded: Promise<AppData> | null = null;

export function loadApp(): Promise<AppData> {
  if (!loaded) {
    loaded = loadAppOnce().catch((error: unknown) => {
      loaded = null;
      throw error;
    });
  }
  return loaded;
}

export function putSession(session: WorkoutSession): Promise<void> {
  return write(async () => {
    const db = await getDB();
    await db.put("sessions", session);
  });
}

export function deleteSessionRecord(id: string): Promise<void> {
  return write(async () => {
    const db = await getDB();
    await db.delete("sessions", id);
  });
}

export function putRoutine(routine: Routine): Promise<void> {
  return write(async () => {
    const db = await getDB();
    await db.put("routines", routine);
  });
}

export function deleteRoutineRecord(id: string): Promise<void> {
  return write(async () => {
    const db = await getDB();
    await db.delete("routines", id);
  });
}

export function putMetric(metric: BodyMetric): Promise<void> {
  return write(async () => {
    const db = await getDB();
    await db.put("metrics", metric);
  });
}

export function deleteMetricRecord(id: string): Promise<void> {
  return write(async () => {
    const db = await getDB();
    await db.delete("metrics", id);
  });
}

export function putCustomExercise(exercise: Exercise): Promise<void> {
  return write(async () => {
    const db = await getDB();
    await db.put("customExercises", exercise);
  });
}

export function putSettings(settings: AppSettings): Promise<void> {
  return write(async () => {
    const db = await getDB();
    const record: SettingsRecord = { ...settings, key: "settings" };
    await db.put("meta", record);
  });
}

export function replaceAll(data: AppData): Promise<void> {
  return write(async () => {
    const db = await getDB();
    const tx = db.transaction(["sessions", "routines", "metrics", "customExercises", "meta"], "readwrite");
    await Promise.all([
      tx.objectStore("sessions").clear(),
      tx.objectStore("routines").clear(),
      tx.objectStore("metrics").clear(),
      tx.objectStore("customExercises").clear(),
    ]);
    for (const session of data.sessions) await tx.objectStore("sessions").put(session);
    for (const routine of data.routines) await tx.objectStore("routines").put(routine);
    for (const metric of data.metrics) await tx.objectStore("metrics").put(metric);
    for (const exercise of data.customExercises) await tx.objectStore("customExercises").put(exercise);
    const record: SettingsRecord = { ...data.settings, key: "settings", seeded: true };
    await tx.objectStore("meta").put(record);
    await tx.done;
  });
}
