import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppSettings, GamePackId, Trip } from "../models/types";
import { DEFAULT_SETTINGS } from "../models/types";
import {
  deleteTrip as dbDeleteTrip,
  ensureSchemaMeta,
  loadAllTrips,
  loadSettings,
  replaceAllTrips,
  saveSettings as dbSaveSettings,
  saveTrip,
  storageError,
} from "../db/database";
import {
  addPacksToTrip,
  AppError,
  createTripInput,
  finishTrip,
  markMissing,
  markSpotted,
  renameTrip,
  reopenTrip,
  resetSightings,
  setSightingNote,
} from "../services/trips";
import {
  importTripCopy,
  parseExportBundle,
  parseJsonFile,
} from "../services/importExport";

export type StoreStatus = "loading" | "ready" | "unavailable" | "quota";

export function useStore() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<StoreStatus>("loading");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    try {
      await ensureSchemaMeta();
      const [nextTrips, nextSettings] = await Promise.all([
        loadAllTrips(),
        loadSettings(),
      ]);
      setTrips(nextTrips);
      setSettings(nextSettings);
      setStatus("ready");
      setMessage("");
    } catch (error) {
      const appError = storageError(error);
      setStatus(appError.code === "quota" ? "quota" : "unavailable");
      setMessage(appError.message);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persistTrip = useCallback(async (trip: Trip) => {
    await saveTrip(trip);
    setTrips((prev) => {
      const others = prev.filter((item) => item.id !== trip.id);
      return [trip, ...others].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
  }, []);

  const createTrip = useCallback(
    async (input: {
      name: string;
      startDate: string;
      packIds: GamePackId[];
      safetyAcknowledged: boolean;
    }) => {
      const trip = createTripInput(input);
      await persistTrip(trip);
      return trip;
    },
    [persistTrip],
  );

  const updateTrip = useCallback(
    async (id: string, updater: (trip: Trip) => Trip) => {
      const current = trips.find((item) => item.id === id);
      if (!current) {
        throw new AppError("missing", "That trip could not be found.");
      }
      const next = updater(current);
      await persistTrip(next);
      return next;
    },
    [persistTrip, trips],
  );

  const removeTrip = useCallback(async (id: string) => {
    await dbDeleteTrip(id);
    setTrips((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const saveSettings = useCallback(async (next: AppSettings) => {
    await dbSaveSettings(next);
    setSettings(next);
  }, []);

  const importFromText = useCallback(
    async (text: string, mode: "trip" | "full") => {
      const bundle = parseExportBundle(parseJsonFile(text));
      if (mode === "trip") {
        if (bundle.kind !== "trip") {
          throw new AppError("malformed", "Choose a single-trip backup for this import.");
        }
        const existing = new Set(trips.map((item) => item.id));
        const copy = importTripCopy(bundle.trip, existing);
        await persistTrip(copy);
        return copy;
      }
      if (bundle.kind !== "full") {
        throw new AppError("malformed", "Choose a full backup to restore all data.");
      }
      await replaceAllTrips(bundle.trips);
      await dbSaveSettings(bundle.settings);
      setTrips(bundle.trips.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      setSettings(bundle.settings);
      return null;
    },
    [persistTrip, trips],
  );

  const tripById = useCallback(
    (id: string | undefined) => trips.find((item) => item.id === id) ?? null,
    [trips],
  );

  const actions = useMemo(
    () => ({
      createTrip,
      rename: (id: string, name: string) =>
        updateTrip(id, (trip) => renameTrip(trip, name)),
      finish: (id: string) => updateTrip(id, finishTrip),
      reopen: (id: string) => updateTrip(id, reopenTrip),
      addPacks: (id: string, packIds: GamePackId[]) =>
        updateTrip(id, (trip) => addPacksToTrip(trip, packIds)),
      reset: (id: string) => updateTrip(id, resetSightings),
      remove: removeTrip,
      spot: (id: string, code: string) =>
        updateTrip(id, (trip) => markSpotted(trip, code)),
      unspot: (id: string, code: string) =>
        updateTrip(id, (trip) => markMissing(trip, code)),
      setNote: (id: string, code: string, note: string) =>
        updateTrip(id, (trip) => setSightingNote(trip, code, note)),
      saveSettings,
      importFromText,
      refresh,
    }),
    [createTrip, importFromText, refresh, removeTrip, saveSettings, updateTrip],
  );

  return { trips, settings, status, message, tripById, ...actions };
}
