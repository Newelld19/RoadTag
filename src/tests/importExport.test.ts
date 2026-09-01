import { describe, expect, it } from "vitest";
import { createTripInput, markSpotted } from "../services/trips";
import {
  importTripCopy,
  parseExportBundle,
  parseJsonFile,
  serializeAll,
  serializeTrip,
} from "../services/importExport";
import { DEFAULT_SETTINGS } from "../models/types";

function trip() {
  return markSpotted(
    createTripInput({
      name: "Export me",
      startDate: "2026-08-01",
      packIds: ["us", "dc"],
      safetyAcknowledged: true,
    }),
    "CA",
  );
}

describe("import and export", () => {
  it("round-trips a trip JSON export", () => {
    const bundle = serializeTrip(trip());
    const parsed = parseExportBundle(bundle);
    expect(parsed.kind).toBe("trip");
    if (parsed.kind === "trip") {
      expect(parsed.trip.name).toBe("Export me");
      expect(parsed.trip.sightings[0]?.jurisdictionCode).toBe("CA");
    }
  });

  it("rejects malformed JSON", () => {
    expect(() => parseJsonFile("{nope")).toThrow(/not valid JSON/);
  });

  it("rejects unsupported schema versions", () => {
    expect(() =>
      parseExportBundle({
        schemaVersion: 99,
        kind: "trip",
        exportedAt: new Date().toISOString(),
        trip: trip(),
      }),
    ).toThrow(/Unsupported backup version/);
  });

  it("imports a duplicate UUID as a copy", () => {
    const original = trip();
    const copy = importTripCopy(original, new Set([original.id]));
    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe(original.name);
  });

  it("serializes a full backup", () => {
    const bundle = serializeAll([trip()], DEFAULT_SETTINGS);
    const parsed = parseExportBundle(bundle);
    expect(parsed.kind).toBe("full");
  });
});
