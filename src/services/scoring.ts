import type { GamePackId, PackProgress, Sighting, Trip } from "../models/types";
import { JURISDICTIONS, jurisdictionsForPacks } from "../data/jurisdictions";

export function sightingMap(trip: Trip): Map<string, Sighting> {
  return new Map(trip.sightings.map((item) => [item.jurisdictionCode, item]));
}

export function isSpotted(trip: Trip, code: string): boolean {
  return trip.sightings.some((item) => item.jurisdictionCode === code);
}

export function packProgress(trip: Trip, packId: GamePackId): PackProgress {
  const members = JURISDICTIONS.filter((item) => item.packId === packId);
  const spottedCodes = new Set(trip.sightings.map((item) => item.jurisdictionCode));
  const spotted = members.filter((item) => spottedCodes.has(item.code)).length;
  return { packId, spotted, total: members.length };
}

export function selectedPackProgress(trip: Trip): PackProgress[] {
  return trip.packIds.map((packId) => packProgress(trip, packId));
}

export function overallProgress(trip: Trip): { spotted: number; total: number } {
  const members = jurisdictionsForPacks(trip.packIds);
  const spottedCodes = new Set(trip.sightings.map((item) => item.jurisdictionCode));
  const spotted = members.filter((item) => spottedCodes.has(item.code)).length;
  return { spotted, total: members.length };
}

export function usFiftyProgress(trip: Trip): PackProgress | null {
  if (!trip.packIds.includes("us")) {
    return null;
  }
  return packProgress(trip, "us");
}

export function isUsFiftyComplete(trip: Trip): boolean {
  const us = usFiftyProgress(trip);
  return Boolean(us && us.spotted === us.total && us.total === 50);
}

export function percentage(spotted: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((spotted / total) * 100);
}

export function recentSightings(trip: Trip, limit = 8): Sighting[] {
  return [...trip.sightings]
    .sort((a, b) => b.spottedAt.localeCompare(a.spottedAt))
    .slice(0, limit);
}
