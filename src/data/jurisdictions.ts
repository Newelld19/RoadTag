import type { GamePack, GamePackId, Jurisdiction } from "../models/types";

export const GAME_PACKS: GamePack[] = [
  {
    id: "us",
    name: "United States",
    description: "All 50 states. Does not include D.C. or territories.",
  },
  {
    id: "dc",
    name: "Washington, D.C.",
    description: "Optional and separate from the 50-state total.",
  },
  {
    id: "territories",
    name: "U.S. territories",
    description:
      "American Samoa, Guam, Northern Mariana Islands, Puerto Rico, U.S. Virgin Islands.",
  },
  {
    id: "canada",
    name: "Canada",
    description: "Ten provinces and three territories.",
  },
];

const US_STATES: Array<[string, string]> = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
];

const TERRITORIES: Array<[string, string]> = [
  ["AS", "American Samoa"],
  ["GU", "Guam"],
  ["MP", "Northern Mariana Islands"],
  ["PR", "Puerto Rico"],
  ["VI", "U.S. Virgin Islands"],
];

const CANADA: Array<[string, string]> = [
  ["AB", "Alberta"],
  ["BC", "British Columbia"],
  ["MB", "Manitoba"],
  ["NB", "New Brunswick"],
  ["NL", "Newfoundland and Labrador"],
  ["NS", "Nova Scotia"],
  ["ON", "Ontario"],
  ["PE", "Prince Edward Island"],
  ["QC", "Quebec"],
  ["SK", "Saskatchewan"],
  ["NT", "Northwest Territories"],
  ["NU", "Nunavut"],
  ["YT", "Yukon"],
];

function toJurisdictions(
  rows: Array<[string, string]>,
  packId: GamePackId,
): Jurisdiction[] {
  return rows.map(([code, name]) => ({
    code,
    name,
    abbreviation: code,
    packId,
  }));
}

export const JURISDICTIONS: Jurisdiction[] = [
  ...toJurisdictions(US_STATES, "us"),
  {
    code: "DC",
    name: "Washington, D.C.",
    abbreviation: "DC",
    packId: "dc",
  },
  ...toJurisdictions(TERRITORIES, "territories"),
  ...toJurisdictions(CANADA, "canada"),
];

export const JURISDICTION_BY_CODE: Record<string, Jurisdiction> = Object.fromEntries(
  JURISDICTIONS.map((item) => [item.code, item]),
);

export const NORTHEAST_CODES = [
  "ME",
  "NH",
  "VT",
  "MA",
  "RI",
  "CT",
  "NY",
  "NJ",
  "DE",
  "MD",
  "DC",
] as const;

export function packById(id: GamePackId): GamePack {
  const pack = GAME_PACKS.find((item) => item.id === id);
  if (!pack) {
    throw new Error(`Unknown pack: ${id}`);
  }
  return pack;
}

export function jurisdictionsForPacks(packIds: GamePackId[]): Jurisdiction[] {
  const selected = new Set(packIds);
  return JURISDICTIONS.filter((item) => selected.has(item.packId));
}

export function isValidPackId(value: string): value is GamePackId {
  return GAME_PACKS.some((pack) => pack.id === value);
}
