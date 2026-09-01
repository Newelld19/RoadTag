import type { Trip } from "../models/types";
import { overallProgress, percentage, usFiftyProgress } from "../services/scoring";
import { formatUpdated } from "../services/trips";

interface Props {
  trips: Trip[];
  onOpen: (id: string) => void;
}

export function TripCardList({ trips, onOpen }: Props) {
  if (trips.length === 0) {
    return <p className="muted">No trips yet. Create one before you hit the road.</p>;
  }

  return (
    <div className="trip-list">
      {trips.map((trip) => {
        const overall = overallProgress(trip);
        const us = usFiftyProgress(trip);
        return (
          <button
            key={trip.id}
            type="button"
            className="trip-card"
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
        );
      })}
    </div>
  );
}
