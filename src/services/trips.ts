import {
  MAX_NOTE_LENGTH,
  MAX_TRIP_NAME_LENGTH,
  type GamePackId,
  type Sighting,
  type Trip,
} from "../models/types";
import { isValidPackId, JURISDICTION_BY_CODE } from "../data/jurisdictions";

// eslint-disable-next-line no-control-regex -- strip imported control characters
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function sanitizeText(value: string, maxLength: number): string {
  return value.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function sanitizeNote(value: string): string {
  return value
    .replace(CONTROL_CHARS, "")
    .replace(/[^\S\n]+/g, " ")
    .trim()
    .slice(0, MAX_NOTE_LENGTH);
}

export function sanitizeTripName(value: string): string {
  return sanitizeText(value, MAX_TRIP_NAME_LENGTH);
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function createId(): string {
  return crypto.randomUUID();
}

export function formatUpdated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatSpottedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export class AppError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export function assertAtLeastOnePack(packIds: GamePackId[]): void {
  if (packIds.length === 0) {
    throw new AppError("packs", "Select at least one game pack.");
  }
}

export function createTripInput(input: {
  name: string;
  startDate: string;
  packIds: GamePackId[];
  safetyAcknowledged: boolean;
}): Trip {
  const name = sanitizeTripName(input.name);
  if (!name) {
    throw new AppError("name", "Give this trip a name.");
  }
  if (!input.safetyAcknowledged) {
    throw new AppError("safety", "Please acknowledge the passenger safety note.");
  }
  assertAtLeastOnePack(input.packIds);
  const timestamp = nowIso();
  return {
    id: createId(),
    name,
    startDate: input.startDate || todayDate(),
    endDate: null,
    packIds: uniquePacks(input.packIds),
    createdAt: timestamp,
    updatedAt: timestamp,
    sightings: [],
    safetyAcknowledged: true,
    finished: false,
  };
}

export function uniquePacks(packIds: GamePackId[]): GamePackId[] {
  return [...new Set(packIds)];
}

export function addPacksToTrip(trip: Trip, packIds: GamePackId[]): Trip {
  if (trip.finished) {
    throw new AppError("readonly", "Reopen this trip before changing it.");
  }
  const next = uniquePacks([...trip.packIds, ...packIds]);
  return { ...trip, packIds: next, updatedAt: nowIso() };
}

export function renameTrip(trip: Trip, name: string): Trip {
  if (trip.finished) {
    throw new AppError("readonly", "Reopen this trip before changing it.");
  }
  const nextName = sanitizeTripName(name);
  if (!nextName) {
    throw new AppError("name", "Give this trip a name.");
  }
  return { ...trip, name: nextName, updatedAt: nowIso() };
}

export function finishTrip(trip: Trip): Trip {
  if (trip.finished) {
    return trip;
  }
  return {
    ...trip,
    finished: true,
    endDate: trip.endDate ?? todayDate(),
    updatedAt: nowIso(),
  };
}

export function reopenTrip(trip: Trip): Trip {
  if (!trip.finished) {
    return trip;
  }
  return { ...trip, finished: false, updatedAt: nowIso() };
}

export function resetSightings(trip: Trip): Trip {
  if (trip.finished) {
    throw new AppError("readonly", "Reopen this trip before changing it.");
  }
  return { ...trip, sightings: [], updatedAt: nowIso() };
}

export function markSpotted(trip: Trip, code: string, at = nowIso()): Trip {
  if (trip.finished) {
    throw new AppError("readonly", "Reopen this trip before changing it.");
  }
  const jurisdiction = JURISDICTION_BY_CODE[code];
  if (!jurisdiction || !trip.packIds.includes(jurisdiction.packId)) {
    throw new AppError("jurisdiction", "That place is not in this trip.");
  }
  if (trip.sightings.some((item) => item.jurisdictionCode === code)) {
    return trip;
  }
  const sighting: Sighting = { jurisdictionCode: code, spottedAt: at, note: "" };
  return {
    ...trip,
    sightings: [...trip.sightings, sighting],
    updatedAt: at,
  };
}

export function markMissing(trip: Trip, code: string): Trip {
  if (trip.finished) {
    throw new AppError("readonly", "Reopen this trip before changing it.");
  }
  if (!trip.sightings.some((item) => item.jurisdictionCode === code)) {
    return trip;
  }
  return {
    ...trip,
    sightings: trip.sightings.filter((item) => item.jurisdictionCode !== code),
    updatedAt: nowIso(),
  };
}

export function setSightingNote(trip: Trip, code: string, note: string): Trip {
  if (trip.finished) {
    throw new AppError("readonly", "Reopen this trip before changing it.");
  }
  const nextNote = sanitizeNote(note);
  const existing = trip.sightings.find((item) => item.jurisdictionCode === code);
  if (!existing) {
    throw new AppError("jurisdiction", "Spot this place before adding a note.");
  }
  return {
    ...trip,
    sightings: trip.sightings.map((item) =>
      item.jurisdictionCode === code ? { ...item, note: nextNote } : item,
    ),
    updatedAt: nowIso(),
  };
}

export function isValidJurisdictionCode(code: string): boolean {
  return Boolean(JURISDICTION_BY_CODE[code]);
}

export function isValidPackList(value: unknown): value is GamePackId[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => isValidPackId(String(item)))
  );
}
