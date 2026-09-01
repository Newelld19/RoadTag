import type { Jurisdiction, SightingFilter, SpottedSort, Trip } from "../models/types";
import { isSpotted } from "./scoring";

export function matchesQuery(item: Jurisdiction, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return (
    item.name.toLowerCase().includes(needle) ||
    item.abbreviation.toLowerCase().includes(needle) ||
    item.code.toLowerCase().includes(needle)
  );
}

export function visibleJurisdictions(
  items: Jurisdiction[],
  trip: Trip,
  filter: SightingFilter,
  query: string,
  spottedSort: SpottedSort,
): Jurisdiction[] {
  const filtered = items.filter((item) => {
    if (!matchesQuery(item, query)) {
      return false;
    }
    const spotted = isSpotted(trip, item.code);
    if (filter === "spotted") {
      return spotted;
    }
    if (filter === "missing") {
      return !spotted;
    }
    return true;
  });

  const alphabetical = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  if (spottedSort !== "below-missing" || filter !== "all") {
    return alphabetical;
  }
  return [
    ...alphabetical.filter((item) => !isSpotted(trip, item.code)),
    ...alphabetical.filter((item) => isSpotted(trip, item.code)),
  ];
}
