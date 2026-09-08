import { useState } from "react";
import type { Trip } from "../models/types";
import { MAX_TRIP_NAME_LENGTH } from "../models/types";
import { overallProgress, percentage, usFiftyProgress } from "../services/scoring";
import { formatUpdated } from "../services/trips";
import { ConfirmDialog, Dialog } from "./Dialog";

interface Props {
  trips: Trip[];
  onOpen: (id: string) => void;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TripCardList({ trips, onOpen, onRename, onDelete }: Props) {
  const [renameTrip, setRenameTrip] = useState<Trip | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTrip, setDeleteTrip] = useState<Trip | null>(null);
  const [error, setError] = useState("");

  if (trips.length === 0) {
    return <p className="muted">No trips yet. Create one before you hit the road.</p>;
  }

  return (
    <div className="trip-list">
      {error ? <p className="error-banner">{error}</p> : null}
      {trips.map((trip) => {
        const overall = overallProgress(trip);
        const us = usFiftyProgress(trip);
        return (
          <article key={trip.id} className="trip-card">
            <button
              type="button"
              className="trip-card-icon trip-card-icon-rename"
              aria-label={`Rename trip ${trip.name}`}
              onClick={() => {
                setError("");
                setRenameTrip(trip);
                setRenameValue(trip.name);
              }}
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              className="trip-card-icon trip-card-icon-delete danger"
              aria-label={`Delete trip ${trip.name}`}
              onClick={() => {
                setError("");
                setDeleteTrip(trip);
              }}
            >
              <TrashIcon />
            </button>
            <button
              type="button"
              className="trip-card-main"
              onClick={() => onOpen(trip.id)}
              aria-label={`Open trip ${trip.name}`}
            >
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{trip.name}</strong>
                {trip.finished ? <span className="badge">Finished</span> : null}
              </div>
              <p className="muted">
                {overall.spotted} of {overall.total} overall ·{" "}
                {percentage(overall.spotted, overall.total)}%
              </p>
              {us ? (
                <p className="muted">
                  {us.spotted} of {us.total} states
                  {us.spotted === 50 ? " · 50 states complete" : ""}
                </p>
              ) : null}
              <p className="muted">Updated {formatUpdated(trip.updatedAt)}</p>
            </button>
          </article>
        );
      })}
      {renameTrip ? (
        <Dialog
          title="Rename trip"
          onClose={() => {
            setRenameTrip(null);
            setError("");
          }}
        >
          <label className="field">
            Trip name
            <input
              value={renameValue}
              maxLength={MAX_TRIP_NAME_LENGTH}
              autoFocus
              onChange={(event) => setRenameValue(event.target.value)}
            />
          </label>
          <div className="row">
            <button
              type="button"
              className="button"
              onClick={() => {
                setRenameTrip(null);
                setError("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => {
                const id = renameTrip.id;
                void onRename(id, renameValue)
                  .then(() => {
                    setRenameTrip(null);
                    setError("");
                  })
                  .catch((err: unknown) => {
                    setError(err instanceof Error ? err.message : "Rename failed.");
                  });
              }}
            >
              Save
            </button>
          </div>
        </Dialog>
      ) : null}
      {deleteTrip ? (
        <ConfirmDialog
          title="Delete this trip?"
          body="This cannot be undone unless you have a JSON backup."
          confirmLabel="Delete"
          danger
          onCancel={() => setDeleteTrip(null)}
          onConfirm={() => {
            const id = deleteTrip.id;
            setDeleteTrip(null);
            void onDelete(id).catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Delete failed.");
            });
          }}
        />
      ) : null}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l9.06-9.06.92.92L5.92 19.58zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  );
}
