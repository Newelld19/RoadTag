import { beforeEach, describe, expect, it } from "vitest";
import { deleteDB } from "idb";
import {
  deleteTrip,
  loadAllTrips,
  loadSettings,
  closeRoadTagDb,
  saveSettings,
  saveTrip,
} from "../db/database";
import { createTripInput } from "../services/trips";
import { DEFAULT_SETTINGS } from "../models/types";

describe("IndexedDB persistence", () => {
  beforeEach(async () => {
    await closeRoadTagDb();
    await deleteDB("roadtag");
  });

  it("persists trips", async () => {
    const trip = createTripInput({
      name: "Stored",
      startDate: "2026-08-01",
      packIds: ["us"],
      safetyAcknowledged: true,
    });
    await saveTrip(trip);
    const loaded = await loadAllTrips();
    expect(loaded[0]?.name).toBe("Stored");
    await deleteTrip(trip.id);
    expect(await loadAllTrips()).toHaveLength(0);
  });

  it("persists settings", async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, theme: "dark" });
    const loaded = await loadSettings();
    expect(loaded.theme).toBe("dark");
  });
});
