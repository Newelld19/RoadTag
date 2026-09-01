import { describe, expect, it } from "vitest";
import {
  addPacksToTrip,
  AppError,
  createTripInput,
  finishTrip,
  markSpotted,
  renameTrip,
  reopenTrip,
  resetSightings,
  sanitizeNote,
  sanitizeTripName,
} from "../services/trips";

describe("trips", () => {
  it("creates a trip", () => {
    const trip = createTripInput({
      name: "  Coast  ",
      startDate: "2026-07-04",
      packIds: ["us", "us"],
      safetyAcknowledged: true,
    });
    expect(trip.name).toBe("Coast");
    expect(trip.packIds).toEqual(["us"]);
    expect(trip.finished).toBe(false);
    expect(trip.sightings).toEqual([]);
  });

  it("requires a name, a pack, and the safety note", () => {
    expect(() =>
      createTripInput({
        name: "   ",
        startDate: "2026-07-04",
        packIds: ["us"],
        safetyAcknowledged: true,
      }),
    ).toThrow(AppError);
    expect(() =>
      createTripInput({
        name: "Trip",
        startDate: "2026-07-04",
        packIds: [],
        safetyAcknowledged: true,
      }),
    ).toThrow(AppError);
    expect(() =>
      createTripInput({
        name: "Trip",
        startDate: "2026-07-04",
        packIds: ["us"],
        safetyAcknowledged: false,
      }),
    ).toThrow(AppError);
  });

  it("renames a trip", () => {
    const trip = createTripInput({
      name: "Old",
      startDate: "2026-07-04",
      packIds: ["us"],
      safetyAcknowledged: true,
    });
    expect(renameTrip(trip, "New").name).toBe("New");
  });

  it("resets sightings", () => {
    const trip = markSpotted(
      createTripInput({
        name: "Reset me",
        startDate: "2026-07-04",
        packIds: ["us"],
        safetyAcknowledged: true,
      }),
      "OR",
    );
    expect(resetSightings(trip).sightings).toHaveLength(0);
  });

  it("keeps finished trips read-only until reopened", () => {
    const trip = finishTrip(
      createTripInput({
        name: "Done",
        startDate: "2026-07-04",
        packIds: ["us"],
        safetyAcknowledged: true,
      }),
    );
    expect(trip.finished).toBe(true);
    expect(trip.endDate).toBeTruthy();
    expect(() => markSpotted(trip, "CA")).toThrow(/Reopen/);
    const open = reopenTrip(trip);
    expect(open.finished).toBe(false);
    expect(markSpotted(open, "CA").sightings).toHaveLength(1);
  });

  it("adds packs after create and starts them at zero", () => {
    const trip = markSpotted(
      createTripInput({
        name: "West",
        startDate: "2026-07-04",
        packIds: ["us"],
        safetyAcknowledged: true,
      }),
      "WA",
    );
    const withCanada = addPacksToTrip(trip, ["canada"]);
    expect(withCanada.packIds).toContain("canada");
    expect(withCanada.sightings).toHaveLength(1);
  });

  it("sanitizes names and notes", () => {
    expect(sanitizeTripName("Hi\u0007 there")).toBe("Hi there");
    expect(sanitizeNote("a".repeat(400)).length).toBe(280);
  });
});
