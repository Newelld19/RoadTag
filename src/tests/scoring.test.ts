import { describe, expect, it } from "vitest";
import { createTripInput, markMissing, markSpotted } from "../services/trips";
import {
  isUsFiftyComplete,
  overallProgress,
  packProgress,
  percentage,
  usFiftyProgress,
} from "../services/scoring";

function usTrip() {
  return createTripInput({
    name: "I-80",
    startDate: "2026-08-01",
    packIds: ["us"],
    safetyAcknowledged: true,
  });
}

describe("scoring", () => {
  it("starts a new U.S. trip at 0 of 50", () => {
    const trip = usTrip();
    const us = usFiftyProgress(trip);
    expect(us).toEqual({ packId: "us", spotted: 0, total: 50 });
    expect(overallProgress(trip)).toEqual({ spotted: 0, total: 50 });
  });

  it("updates the total when a state is marked", () => {
    const trip = markSpotted(usTrip(), "CA");
    expect(usFiftyProgress(trip)?.spotted).toBe(1);
  });

  it("does not count a state twice", () => {
    const once = markSpotted(usTrip(), "CA");
    const twice = markSpotted(once, "CA");
    expect(usFiftyProgress(twice)?.spotted).toBe(1);
    expect(twice.sightings).toHaveLength(1);
  });

  it("restores the previous total on undo", () => {
    const spotted = markSpotted(usTrip(), "TX");
    const undone = markMissing(spotted, "TX");
    expect(usFiftyProgress(undone)?.spotted).toBe(0);
  });

  it("removes a sighting when marked missing", () => {
    const spotted = markSpotted(usTrip(), "NY");
    expect(markMissing(spotted, "NY").sightings).toHaveLength(0);
  });

  it("keeps optional packs on independent totals", () => {
    const trip = createTripInput({
      name: "North",
      startDate: "2026-08-01",
      packIds: ["us", "dc", "canada"],
      safetyAcknowledged: true,
    });
    const spotted = markSpotted(markSpotted(trip, "ON"), "DC");
    expect(packProgress(spotted, "us").spotted).toBe(0);
    expect(packProgress(spotted, "dc").spotted).toBe(1);
    expect(packProgress(spotted, "canada").spotted).toBe(1);
    expect(usFiftyProgress(spotted)?.spotted).toBe(0);
  });

  it("does not let Washington, D.C. change the 50-state total", () => {
    const trip = createTripInput({
      name: "Capitol",
      startDate: "2026-08-01",
      packIds: ["us", "dc"],
      safetyAcknowledged: true,
    });
    const spotted = markSpotted(trip, "DC");
    expect(usFiftyProgress(spotted)?.spotted).toBe(0);
    expect(packProgress(spotted, "dc").spotted).toBe(1);
    expect(isUsFiftyComplete(spotted)).toBe(false);
  });

  it("computes percentage from overall totals", () => {
    expect(percentage(25, 50)).toBe(50);
    expect(percentage(0, 0)).toBe(0);
  });
});
