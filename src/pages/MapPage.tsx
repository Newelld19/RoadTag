import { useMemo, useState } from "react";
import { JurisdictionDetails } from "../components/JurisdictionDetails";
import { JurisdictionList } from "../components/JurisdictionList";
import { UsMap } from "../components/UsMap";
import { jurisdictionsForPacks, JURISDICTION_BY_CODE } from "../data/jurisdictions";
import type { Trip } from "../models/types";
import { isSpotted } from "../services/scoring";
import { visibleJurisdictions } from "../services/list";

interface Props {
  trip: Trip;
  onBack: () => void;
  onSpot: (code: string) => Promise<void>;
  onUnspot: (code: string) => Promise<void>;
  onNote: (code: string, note: string) => Promise<void>;
}

export function MapPage({ trip, onBack, onSpot, onUnspot, onNote }: Props) {
  const [openCode, setOpenCode] = useState<string | null>(null);
  const extraPacks = trip.packIds.filter((id) => id === "territories" || id === "canada");
  const extraItems = useMemo(
    () =>
      visibleJurisdictions(
        jurisdictionsForPacks(extraPacks),
        trip,
        "all",
        "",
        "in-place",
      ),
    [extraPacks, trip],
  );
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
        <h1>Map</h1>
      </div>
      <div className="map-layout stack">
        {trip.packIds.includes("us") || trip.packIds.includes("dc") ? (
          <UsMap
            trip={trip}
            selectedCode={openCode ?? undefined}
            onMissing={(code) => void onSpot(code)}
            onOpen={setOpenCode}
          />
        ) : (
          <p className="muted">This trip has no U.S. map. Use the lists below.</p>
        )}
        {extraItems.length > 0 ? (
          <section className="card">
            <h2 className="screen-title">Canada and territories</h2>
            <JurisdictionList
              trip={trip}
              items={extraItems}
              emptyLabel="Nothing to show."
              onSelect={(item) => {
                if (trip.finished || isSpotted(trip, item.code)) {
                  setOpenCode(item.code);
                  return;
                }
                void onSpot(item.code);
              }}
            />
          </section>
        ) : null}
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
