import {
  SCHEMA_VERSION,
  type AppSettings,
  type ExportBundle,
  type FullExportBundle,
  type GamePackId,
  type Sighting,
  type Trip,
  type TripExportBundle,
} from "../models/types";
import { DEFAULT_SETTINGS } from "../models/types";
import {
  AppError,
  createId,
  isUuid,
  nowIso,
  sanitizeNote,
  sanitizeTripName,
} from "./trips";
import { isValidJurisdictionCode, isValidPackList } from "./trips";

export function serializeTrip(trip: Trip): TripExportBundle {
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: "trip",
    exportedAt: nowIso(),
    trip: structuredClone(trip),
  };
}

export function serializeAll(trips: Trip[], settings: AppSettings): FullExportBundle {
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: "full",
    exportedAt: nowIso(),
    trips: structuredClone(trips),
    settings: structuredClone(settings),
  };
}

export function parseJsonFile(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError("malformed", "That file is not valid JSON.");
  }
}

export function parseExportBundle(raw: unknown): ExportBundle {
  if (!raw || typeof raw !== "object") {
    throw new AppError("malformed", "That file is missing required fields.");
  }
  const data = raw as Record<string, unknown>;
  if (typeof data.schemaVersion !== "number") {
    throw new AppError("malformed", "That file is missing a schema version.");
  }
  if (data.schemaVersion !== SCHEMA_VERSION) {
    throw new AppError(
      "schema",
      `Unsupported backup version ${String(data.schemaVersion)}. This app reads version ${SCHEMA_VERSION}.`,
    );
  }
  if (data.kind === "trip") {
    return {
      schemaVersion: SCHEMA_VERSION,
      kind: "trip",
      exportedAt: asIso(data.exportedAt),
      trip: parseTrip(data.trip),
    };
  }
  if (data.kind === "full") {
    if (!Array.isArray(data.trips)) {
      throw new AppError("malformed", "That backup is missing trips.");
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      kind: "full",
      exportedAt: asIso(data.exportedAt),
      trips: data.trips.map((item) => parseTrip(item)),
      settings: parseSettings(data.settings),
    };
  }
  throw new AppError("malformed", "That file is not a RoadTag backup.");
}

export function importTripCopy(trip: Trip, existingIds: Set<string>): Trip {
  const id = existingIds.has(trip.id) ? createId() : trip.id;
  return { ...trip, id, updatedAt: nowIso() };
}

function asIso(value: unknown): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    return nowIso();
  }
  return value;
}

function parseTrip(raw: unknown): Trip {
  if (!raw || typeof raw !== "object") {
    throw new AppError("malformed", "A trip in that file is invalid.");
  }
  const data = raw as Record<string, unknown>;
  if (typeof data.id !== "string" || !isUuid(data.id)) {
    throw new AppError("malformed", "A trip is missing a valid id.");
  }
  const name = sanitizeTripName(String(data.name ?? ""));
  if (!name) {
    throw new AppError("malformed", "A trip is missing a name.");
  }
  if (!isValidPackList(data.packIds)) {
    throw new AppError("malformed", "A trip has no valid game packs.");
  }
  if (!Array.isArray(data.sightings)) {
    throw new AppError("malformed", "A trip is missing sightings.");
  }
  return {
    id: data.id,
    name,
    startDate: typeof data.startDate === "string" ? data.startDate.slice(0, 10) : "",
    endDate: typeof data.endDate === "string" ? data.endDate.slice(0, 10) : null,
    packIds: data.packIds as GamePackId[],
    createdAt: asIso(data.createdAt),
    updatedAt: asIso(data.updatedAt),
    sightings: data.sightings.map((item) => parseSighting(item)),
    safetyAcknowledged: Boolean(data.safetyAcknowledged),
    finished: Boolean(data.finished),
  };
}

function parseSighting(raw: unknown): Sighting {
  if (!raw || typeof raw !== "object") {
    throw new AppError("malformed", "A sighting in that file is invalid.");
  }
  const data = raw as Record<string, unknown>;
  if (
    typeof data.jurisdictionCode !== "string" ||
    !isValidJurisdictionCode(data.jurisdictionCode)
  ) {
    throw new AppError("malformed", "A sighting points to an unknown place.");
  }
  return {
    jurisdictionCode: data.jurisdictionCode,
    spottedAt: asIso(data.spottedAt),
    note: sanitizeNote(String(data.note ?? "")),
  };
}

function parseSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_SETTINGS;
  }
  const data = raw as Record<string, unknown>;
  const theme =
    data.theme === "light" || data.theme === "dark" || data.theme === "system"
      ? data.theme
      : DEFAULT_SETTINGS.theme;
  const spottedSort = data.spottedSort === "below-missing" ? "below-missing" : "in-place";
  return {
    theme,
    highContrast: Boolean(data.highContrast),
    accentColor:
      typeof data.accentColor === "string" && /^#[0-9a-f]{6}$/i.test(data.accentColor)
        ? data.accentColor
        : DEFAULT_SETTINGS.accentColor,
    spottedSort,
    reducedMotion: Boolean(data.reducedMotion),
    wakeLock: Boolean(data.wakeLock),
  };
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function shareOrDownloadJson(
  filename: string,
  data: unknown,
): Promise<void> {
  const text = JSON.stringify(data, null, 2);
  const file = new File([text], filename, { type: "application/json" });
  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data: ShareData) => boolean;
  };
  if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
    try {
      await nav.share({
        title: "RoadTag backup",
        files: [file],
        text: "RoadTag trip backup",
      });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }
  }
  downloadJson(filename, data);
}
