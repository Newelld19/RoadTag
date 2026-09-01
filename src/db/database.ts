import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { SCHEMA_VERSION, type AppSettings, type Trip } from "../models/types";
import { DEFAULT_SETTINGS } from "../models/types";
import { AppError } from "../services/trips";

const DB_NAME = "roadtag";
const DB_VERSION = 1;

interface RoadTagDB extends DBSchema {
  trips: {
    key: string;
    value: Trip;
    indexes: { "by-updated": string };
  };
  settings: {
    key: "app";
    value: AppSettings;
  };
  meta: {
    key: "schema";
    value: { schemaVersion: number };
  };
}

let dbPromise: Promise<IDBPDatabase<RoadTagDB>> | null = null;

export function openRoadTagDb(): Promise<IDBPDatabase<RoadTagDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RoadTagDB>(DB_NAME, DB_VERSION, {
      upgrade(database, oldVersion) {
        if (oldVersion < 1) {
          const trips = database.createObjectStore("trips", { keyPath: "id" });
          trips.createIndex("by-updated", "updatedAt");
          database.createObjectStore("settings");
          database.createObjectStore("meta");
        }
      },
    });
  }
  return dbPromise;
}

export function resetDbConnection(): void {
  dbPromise = null;
}

export async function closeRoadTagDb(): Promise<void> {
  if (!dbPromise) {
    return;
  }
  const db = await dbPromise;
  db.close();
  dbPromise = null;
}

export async function loadAllTrips(): Promise<Trip[]> {
  const db = await openRoadTagDb();
  const trips = await db.getAll("trips");
  return trips.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveTrip(trip: Trip): Promise<void> {
  const db = await openRoadTagDb();
  await db.put("trips", trip);
}

export async function deleteTrip(id: string): Promise<void> {
  const db = await openRoadTagDb();
  await db.delete("trips", id);
}

export async function replaceAllTrips(trips: Trip[]): Promise<void> {
  const db = await openRoadTagDb();
  const tx = db.transaction("trips", "readwrite");
  await tx.store.clear();
  await Promise.all(trips.map((trip) => tx.store.put(trip)));
  await tx.done;
}

export async function loadSettings(): Promise<AppSettings> {
  const db = await openRoadTagDb();
  const stored = await db.get("settings", "app");
  if (!stored) {
    await db.put("settings", DEFAULT_SETTINGS, "app");
    return DEFAULT_SETTINGS;
  }
  return stored;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await openRoadTagDb();
  await db.put("settings", settings, "app");
}

export async function ensureSchemaMeta(): Promise<void> {
  const db = await openRoadTagDb();
  const meta = await db.get("meta", "schema");
  if (!meta) {
    await db.put("meta", { schemaVersion: SCHEMA_VERSION }, "schema");
  }
}

export function storageError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : "Storage failed.";
  if (/quota/i.test(message)) {
    return new AppError(
      "quota",
      "This device is out of storage space. Export a backup, then delete old trips.",
    );
  }
  return new AppError(
    "storage",
    "RoadTag could not use on-device storage. Trip data may not save until this is fixed.",
  );
}
