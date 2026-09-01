import type { Jurisdiction, Trip } from "../models/types";
import { isSpotted } from "../services/scoring";

interface Props {
  trip: Trip;
  items: Jurisdiction[];
  emptyLabel: string;
  onSelect: (item: Jurisdiction) => void;
}

export function JurisdictionList({ trip, items, emptyLabel, onSelect }: Props) {
  if (items.length === 0) {
    return <p className="muted">{emptyLabel}</p>;
  }

  return (
    <div className="j-list">
      {items.map((item) => {
        const spotted = isSpotted(trip, item.code);
        return (
          <button
            key={item.code}
            type="button"
            className={`j-item ${spotted ? "spotted" : ""}`}
            onClick={() => onSelect(item)}
            aria-label={
              spotted
                ? `${item.name}, spotted. Open details.`
                : `Mark ${item.name} as spotted`
            }
          >
            <span>
              <strong>{item.name}</strong>
              <span className="abbr"> {item.abbreviation}</span>
            </span>
            <span className="check" aria-hidden="true">
              {spotted ? "✓" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
