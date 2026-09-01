import { describe, expect, it } from "vitest";
import { jurisdictionsForPacks } from "../data/jurisdictions";
import { createTripInput, markSpotted } from "../services/trips";
import { matchesQuery, visibleJurisdictions } from "../services/list";

const ca = jurisdictionsForPacks(["us"]).find((item) => item.code === "CA")!;
const or = jurisdictionsForPacks(["us"]).find((item) => item.code === "OR")!;

describe("search and filters", () => {
  it("searches by state name", () => {
    expect(matchesQuery(ca, "calif")).toBe(true);
    expect(matchesQuery(or, "calif")).toBe(false);
  });

  it("searches by abbreviation", () => {
    expect(matchesQuery(ca, "ca")).toBe(true);
  });

  it("filters missing and spotted", () => {
    const trip = markSpotted(
      createTripInput({
        name: "Filter",
        startDate: "2026-08-01",
        packIds: ["us"],
        safetyAcknowledged: true,
      }),
      "CA",
    );
    const items = [ca, or];
    expect(
      visibleJurisdictions(items, trip, "spotted", "", "in-place").map((i) => i.code),
    ).toEqual(["CA"]);
    expect(
      visibleJurisdictions(items, trip, "missing", "", "in-place").map((i) => i.code),
    ).toEqual(["OR"]);
  });
});
