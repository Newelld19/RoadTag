export const SCHEMA_VERSION = 1;
export const MAX_TRIP_NAME_LENGTH = 80;
export const MAX_NOTE_LENGTH = 280;
export const APP_NAME = "RoadTag";
export const APP_VERSION = "1.0.0";

export type GamePackId = "us" | "dc" | "territories" | "canada";

export type ThemePreference = "light" | "dark" | "system";
export type SpottedSort = "in-place" | "below-missing";
export type SightingFilter = "all" | "spotted" | "missing";

export interface Jurisdiction {
  code: string;
  name: string;
  abbreviation: string;
  packId: GamePackId;
}

export interface GamePack {
  id: GamePackId;
  name: string;
  description: string;
}

export interface Sighting {
  jurisdictionCode: string;
  spottedAt: string;
  note: string;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  packIds: GamePackId[];
  createdAt: string;
  updatedAt: string;
  sightings: Sighting[];
  safetyAcknowledged: boolean;
  finished: boolean;
}

export interface AppSettings {
  theme: ThemePreference;
  highContrast: boolean;
  accentColor: string;
  spottedSort: SpottedSort;
  reducedMotion: boolean;
  wakeLock: boolean;
}

export type ExportKind = "trip" | "full";

export interface TripExportBundle {
  schemaVersion: number;
  kind: "trip";
  exportedAt: string;
  trip: Trip;
}

export interface FullExportBundle {
  schemaVersion: number;
  kind: "full";
  exportedAt: string;
  trips: Trip[];
  settings: AppSettings;
}

export type ExportBundle = TripExportBundle | FullExportBundle;

export interface PackProgress {
  packId: GamePackId;
  spotted: number;
  total: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  highContrast: false,
  accentColor: "#1f4d3a",
  spottedSort: "in-place",
  reducedMotion: false,
  wakeLock: false,
};

export const ACCENT_COLORS = [
  { id: "forest", value: "#1f4d3a", label: "Forest" },
  { id: "rust", value: "#9a3b1a", label: "Rust" },
  { id: "navy", value: "#1d3557", label: "Navy" },
  { id: "amber", value: "#b45309", label: "Amber" },
  { id: "wine", value: "#7f1d1d", label: "Wine" },
] as const;

export const SAFETY_MESSAGE =
  "For safety, only passengers should use this app while the vehicle is moving.";
