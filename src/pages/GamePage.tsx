import { useMemo, useState } from "react";
import { JurisdictionDetails } from "../components/JurisdictionDetails";
import { JurisdictionList } from "../components/JurisdictionList";
import { ProgressSummary } from "../components/ProgressSummary";
import { jurisdictionsForPacks, JURISDICTION_BY_CODE } from "../data/jurisdictions";
import type { SightingFilter, Trip } from "../models/types";
import { isSpotted, recentSightings } from "../services/scoring";
import { visibleJurisdictions } from "../services/list";
import { formatSpottedAt } from "../services/trips";

interface Props {
  trip: Trip;
  spottedSort: "in-place" | "below-missing";
  onBack: () => void;
  onSpot: (code: string) => Promise<void>;
  onUnspot: (code: string) => Promise<void>;
  onNote: (code: string, note: string) => Promise<void>;
  savedHint: boolean;
}

export function GamePage({
  trip,
  spottedSort,
  onBack,
  onSpot,
  onUnspot,
  onNote,
  savedHint,
}: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SightingFilter>("all");
  const [openCode, setOpenCode] = useState<string | null>(null);

  const items = useMemo(() => {
    return visibleJurisdictions(
      jurisdictionsForPacks(trip.packIds),
      trip,
      filter,
      query,
      spottedSort,
    );
  }, [filter, query, spottedSort, trip]);

  const recent = recentSightings(trip);
  const openItem = openCode ? JURISDICTION_BY_CODE[openCode] : undefined;
  const openSighting = trip.sightings.find((item) => item.jurisdictionCode === openCode);

  return (
    <main>
      <div className="topbar">
        <button
          type="button"
          className="icon-button"
          onClick={onBack}
          aria-label="Back to trips"
        >
          Back
        </button>
        <h1>{trip.name}</h1>
        {savedHint ? <span className="muted">Saved</span> : null}
      </div>
      {trip.finished ? (
        <p className="muted">This trip is finished and read-only. Reopen it to edit.</p>
      ) : null}
      <div className="game-layout stack">
        <ProgressSummary trip={trip} />
        <label className="field">
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or abbreviation"
          />
        </label>
        <div className="pills" role="tablist" aria-label="Filter">
          {(["all", "missing", "spotted"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={`pill ${filter === id ? "active" : ""}`}
              onClick={() => setFilter(id)}
            >
              {id[0].toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
        <JurisdictionList
          trip={trip}
          items={items}
          emptyLabel={query ? "No places match that search." : "Nothing in this filter."}
          onSelect={(item) => {
            if (trip.finished || isSpotted(trip, item.code)) {
              setOpenCode(item.code);
              return;
            }
            void onSpot(item.code);
          }}
        />
        <section className="card">
          <h2 className="screen-title">Recent sightings</h2>
          {recent.length === 0 ? (
            <p className="muted">No sightings yet.</p>
          ) : (
            <div className="recent-list">
              {recent.map((sighting) => {
                const item = JURISDICTION_BY_CODE[sighting.jurisdictionCode];
                return (
                  <div
                    key={sighting.jurisdictionCode}
                    className="row"
                    style={{ justifyContent: "space-between" }}
                  >
                    <span>
                      {item?.name ?? sighting.jurisdictionCode}
                      <div className="muted">{formatSpottedAt(sighting.spottedAt)}</div>
                    </span>
                    {!trip.finished ? (
                      <button
                        type="button"
                        className="button"
                        onClick={() => void onUnspot(sighting.jurisdictionCode)}
                      >
                        Undo
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      {openItem ? (
        <JurisdictionDetails
          trip={trip}
          item={openItem}
          sighting={openSighting}
          onClose={() => setOpenCode(null)}
          onMarkMissing={() => {
            void onUnspot(openItem.code);
            setOpenCode(null);
          }}
          onSaveNote={async (note) => {
            await onNote(openItem.code, note);
            setOpenCode(null);
          }}
        />
      ) : null}
    </main>
  );
}
