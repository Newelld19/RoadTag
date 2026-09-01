import { useState } from "react";
import { GAME_PACKS } from "../data/jurisdictions";
import type { GamePackId } from "../models/types";
import { MAX_TRIP_NAME_LENGTH, SAFETY_MESSAGE } from "../models/types";
import { todayDate } from "../services/trips";

interface Props {
  onBack: () => void;
  onCreate: (input: {
    name: string;
    startDate: string;
    packIds: GamePackId[];
    safetyAcknowledged: boolean;
  }) => Promise<void>;
}

export function CreateTripPage({ onBack, onCreate }: Props) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayDate());
  const [packIds, setPackIds] = useState<GamePackId[]>(["us"]);
  const [safety, setSafety] = useState(false);
  const [error, setError] = useState("");

  function togglePack(id: GamePackId) {
    setPackIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  }

  return (
    <main>
      <div className="topbar">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Back">
          Back
        </button>
        <h1>Create trip</h1>
      </div>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          void onCreate({
            name,
            startDate,
            packIds,
            safetyAcknowledged: safety,
          }).catch((err: unknown) => {
            setError(err instanceof Error ? err.message : "Could not create the trip.");
          });
        }}
      >
        <label className="field">
          Trip name
          <input
            value={name}
            maxLength={MAX_TRIP_NAME_LENGTH}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className="field">
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <fieldset className="card" style={{ border: 0 }}>
          <legend>Game packs</legend>
          {GAME_PACKS.map((pack) => (
            <label key={pack.id} className="pack-toggle">
              <input
                type="checkbox"
                checked={packIds.includes(pack.id)}
                onChange={() => togglePack(pack.id)}
              />
              <span>
                <strong>{pack.name}</strong>
                <div className="muted">{pack.description}</div>
              </span>
            </label>
          ))}
        </fieldset>
        <p>{SAFETY_MESSAGE}</p>
        <label className="pack-toggle">
          <input
            type="checkbox"
            checked={safety}
            onChange={(event) => setSafety(event.target.checked)}
          />
          I understand. I will not use this app while driving.
        </label>
        {error ? <p className="error-banner">{error}</p> : null}
        <button type="submit" className="button primary">
          Create trip
        </button>
      </form>
    </main>
  );
}
