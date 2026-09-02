import { useRef, useState } from "react";
import { TripCardList } from "../components/TripCardList";
import { Dialog } from "../components/Dialog";
import type { Trip } from "../models/types";
import { APP_NAME, APP_VERSION } from "../models/types";

interface Props {
  trips: Trip[];
  statusMessage?: string;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onSettings: () => void;
  onImportTrip: (text: string) => Promise<void>;
}

export function HomePage({
  trips,
  statusMessage,
  onCreate,
  onOpen,
  onSettings,
  onImportTrip,
}: Props) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <main className="home-screen">
      <div className="home-hero">
        <img src="/RoadTag.png" alt="" className="home-logo" />
        <h1 className="home-title">{APP_NAME}</h1>
      </div>
      {statusMessage ? <p className="error-banner">{statusMessage}</p> : null}
      {error ? <p className="error-banner">{error}</p> : null}
      <div className="home-actions row">
        <button type="button" className="button primary" onClick={onCreate}>
          Create trip
        </button>
        <button type="button" className="button" onClick={() => fileRef.current?.click()}>
          Import data
        </button>
        <button type="button" className="button" onClick={onSettings}>
          Settings
        </button>
        <button type="button" className="button" onClick={() => setRulesOpen(true)}>
          Rules / About
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Import trip JSON"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) {
              return;
            }
            void file.text().then((text) =>
              onImportTrip(text).catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Import failed.");
              }),
            );
          }}
        />
      </div>
      <section className="home-trips">
        <TripCardList trips={trips} onOpen={onOpen} />
      </section>
      {rulesOpen ? (
        <Dialog title="Rules and about" onClose={() => setRulesOpen(false)}>
          <p>
            A sighting is valid when someone in the car sees the plate, or the spotter
            clearly calls out the jurisdiction. Plates may be seen on moving vehicles,
            parked vehicles, or vehicles at stops.
          </p>
          <p>
            RoadTag does not create, reproduce, scan, photograph, or imitate license
            plates. It is a checklist and map-based travel game.
          </p>
          <p className="muted">
            {APP_NAME} {APP_VERSION}
          </p>
        </Dialog>
      ) : null}
    </main>
  );
}
