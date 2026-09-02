import { useState } from "react";
import type { Jurisdiction, Sighting, Trip } from "../models/types";
import { MAX_NOTE_LENGTH } from "../models/types";
import { formatSpottedAt } from "../services/trips";
import { Dialog } from "./Dialog";

interface Props {
  trip: Trip;
  item: Jurisdiction;
  sighting: Sighting | undefined;
  onClose: () => void;
  onUntag: () => void;
  onSaveNote: (note: string) => Promise<void>;
}

export function JurisdictionDetails({
  trip,
  item,
  sighting,
  onClose,
  onUntag,
  onSaveNote,
}: Props) {
  const [note, setNote] = useState(sighting?.note ?? "");
  const readonly = trip.finished;

  return (
    <Dialog title={item.name} onClose={onClose}>
      <p className="muted">{item.abbreviation}</p>
      {sighting ? (
        <p>First tagged {formatSpottedAt(sighting.spottedAt)}</p>
      ) : (
        <p>Not tagged yet.</p>
      )}
      <label className="field">
        Note
        <textarea
          rows={3}
          maxLength={MAX_NOTE_LENGTH}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={readonly || !sighting}
        />
      </label>
      <div className="row">
        {sighting && !readonly ? (
          <button type="button" className="button" onClick={() => void onSaveNote(note)}>
            Save note
          </button>
        ) : null}
        {sighting && !readonly ? (
          <button type="button" className="button danger" onClick={onUntag}>
            UnTag
          </button>
        ) : null}
      </div>
    </Dialog>
  );
}
