import type { Trip } from "../models/types";
import { packById } from "../data/jurisdictions";
import {
  overallProgress,
  percentage,
  selectedPackProgress,
  usFiftyProgress,
} from "../services/scoring";

interface Props {
  trip: Trip;
}

export function ProgressSummary({ trip }: Props) {
  const overall = overallProgress(trip);
  const packs = selectedPackProgress(trip);
  const us = usFiftyProgress(trip);
  const pct = percentage(overall.spotted, overall.total);

  return (
    <section className="card" aria-label="Trip progress">
      <div className="progress-grid">
        {packs.map((pack) => (
          <div key={pack.packId} className="progress-row">
            <span>{packById(pack.packId).name}</span>
            <strong>
              {pack.spotted} of {pack.total}
            </strong>
          </div>
        ))}
        <div className="progress-row">
          <span>Overall</span>
          <strong>
            {overall.spotted} of {overall.total} · {pct}%
          </strong>
        </div>
        <div className="bar" aria-hidden="true">
          <span style={{ width: `${pct}%` }} />
        </div>
        {us && us.spotted === 50 ? (
          <span className="badge">50 states complete</span>
        ) : null}
      </div>
    </section>
  );
}
