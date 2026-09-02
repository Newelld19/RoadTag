import { useRef, useState } from "react";
import { GAME_PACKS, packById } from "../data/jurisdictions";
import type { GamePackId, Trip } from "../models/types";
import { MAX_TRIP_NAME_LENGTH } from "../models/types";
import { ProgressSummary } from "../components/ProgressSummary";
import { ConfirmDialog } from "../components/Dialog";
import { recentSightings } from "../services/scoring";
import { JURISDICTION_BY_CODE } from "../data/jurisdictions";
import { formatSpottedAt } from "../services/trips";
import { serializeTrip, shareOrDownloadJson } from "../services/importExport";

interface Props {
  trip: Trip;
  onBack: () => void;
  onRename: (name: string) => Promise<void>;
  onFinish: () => Promise<void>;
  onReopen: () => Promise<void>;
  onReset: () => Promise<void>;
  onDelete: () => Promise<void>;
  onAddPacks: (packIds: GamePackId[]) => Promise<void>;
}

export function TripDetailsPage({
  trip,
  onBack,
  onRename,
  onFinish,
  onReopen,
  onReset,
  onDelete,
  onAddPacks,
}: Props) {
  const [name, setName] = useState(trip.name);
  const [confirm, setConfirm] = useState<"reset" | "delete" | null>(null);
  const [error, setError] = useState("");
  const extraPacks = GAME_PACKS.filter((pack) => !trip.packIds.includes(pack.id));
  const recent = recentSightings(trip, 10);
  const fileHint = useRef("");
  fileHint.current = trip.name;

  return (
    <main className="stack">
      <div className="topbar">
        <button
          type="button"
          className="icon-button"
          onClick={onBack}
          aria-label="Back to trips"
        >
          Back
        </button>
        <h1>Trip details</h1>
      </div>
      {error ? <p className="error-banner">{error}</p> : null}
      <section className="card stack">
        <label className="field">
          Trip name
          <input
            value={name}
            maxLength={MAX_TRIP_NAME_LENGTH}
            disabled={trip.finished}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        {!trip.finished ? (
          <button
            type="button"
            className="button"
            onClick={() => void onRename(name).catch(setCaught(setError))}
          >
            Rename
          </button>
        ) : null}
        <p>Started {trip.startDate || "—"}</p>
        <p>Ended {trip.endDate || "—"}</p>
        <p>Packs: {trip.packIds.map((id) => packById(id).name).join(", ")}</p>
      </section>
      <ProgressSummary trip={trip} />
      {extraPacks.length > 0 && !trip.finished ? (
        <section className="card stack">
          <h2 className="screen-title">Add a pack</h2>
          <p className="muted">Packs cannot be removed after a trip is created.</p>
          {extraPacks.map((pack) => (
            <button
              key={pack.id}
              type="button"
              className="button"
              onClick={() => void onAddPacks([pack.id]).catch(setCaught(setError))}
            >
              Add {pack.name}
            </button>
          ))}
        </section>
      ) : null}
      <section className="card">
        <h2 className="screen-title">Recent tags</h2>
        {recent.length === 0 ? (
          <p className="muted">No tags yet.</p>
        ) : (
          recent.map((item) => (
            <p key={item.jurisdictionCode}>
              {JURISDICTION_BY_CODE[item.jurisdictionCode]?.name} ·{" "}
              {formatSpottedAt(item.spottedAt)}
            </p>
          ))
        )}
      </section>
      <div className="row">
        {trip.finished ? (
          <button
            type="button"
            className="button primary"
            onClick={() => void onReopen()}
          >
            Reopen trip
          </button>
        ) : (
          <button type="button" className="button" onClick={() => void onFinish()}>
            Finish trip
          </button>
        )}
        <button
          type="button"
          className="button"
          onClick={() =>
            void shareOrDownloadJson(
              `roadtag-${slug(trip.name)}.json`,
              serializeTrip(trip),
            )
          }
        >
          Export trip
        </button>
        {!trip.finished ? (
          <button
            type="button"
            className="button danger"
            onClick={() => setConfirm("reset")}
          >
            Reset sightings
          </button>
        ) : null}
        <button
          type="button"
          className="button danger"
          onClick={() => setConfirm("delete")}
        >
          Delete trip
        </button>
      </div>
      {confirm === "reset" ? (
        <ConfirmDialog
          title="Reset sightings?"
          body="This removes every sighting in this trip. The trip itself stays."
          confirmLabel="Reset"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            void onReset().catch(setCaught(setError));
          }}
        />
      ) : null}
      {confirm === "delete" ? (
        <ConfirmDialog
          title="Delete this trip?"
          body="This cannot be undone unless you have a JSON backup."
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            void onDelete().catch(setCaught(setError));
          }}
        />
      ) : null}
    </main>
  );
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "trip"
  );
}

function setCaught(setError: (value: string) => void) {
  return (error: unknown) => {
    setError(error instanceof Error ? error.message : "Something went wrong.");
  };
}
