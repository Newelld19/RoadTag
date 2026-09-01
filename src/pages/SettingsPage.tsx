import { useRef, useState } from "react";
import type { AppSettings } from "../models/types";
import { ACCENT_COLORS, APP_NAME, APP_VERSION } from "../models/types";
import { ConfirmDialog, Dialog } from "../components/Dialog";
import { serializeAll, shareOrDownloadJson } from "../services/importExport";
import type { Trip } from "../models/types";

interface Props {
  settings: AppSettings;
  trips: Trip[];
  onBack: () => void;
  onSave: (settings: AppSettings) => Promise<void>;
  onRestore: (text: string) => Promise<void>;
}

export function SettingsPage({ settings, trips, onBack, onSave, onRestore }: Props) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function patch(partial: Partial<AppSettings>) {
    void onSave({ ...settings, ...partial }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    });
  }

  return (
    <main className="stack">
      <div className="topbar">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Back">
          Back
        </button>
        <h1>Settings</h1>
      </div>
      {error ? <p className="error-banner">{error}</p> : null}
      <section className="card stack">
        <h2 className="screen-title">Appearance</h2>
        <label className="field">
          Theme
          <select
            value={settings.theme}
            onChange={(event) =>
              patch({ theme: event.target.value as AppSettings["theme"] })
            }
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="pack-toggle">
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(event) => patch({ highContrast: event.target.checked })}
          />
          High contrast
        </label>
        <label className="pack-toggle">
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(event) => patch({ reducedMotion: event.target.checked })}
          />
          Reduced motion
        </label>
        <fieldset style={{ border: 0, padding: 0 }}>
          <legend>Accent color</legend>
          <div className="row">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                className={`button ${settings.accentColor === color.value ? "primary" : ""}`}
                onClick={() => patch({ accentColor: color.value })}
              >
                {color.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field">
          Spotted places
          <select
            value={settings.spottedSort}
            onChange={(event) =>
              patch({ spottedSort: event.target.value as AppSettings["spottedSort"] })
            }
          >
            <option value="in-place">Stay in place</option>
            <option value="below-missing">Move below missing</option>
          </select>
        </label>
        <label className="pack-toggle">
          <input
            type="checkbox"
            checked={settings.wakeLock}
            onChange={(event) => patch({ wakeLock: event.target.checked })}
          />
          Keep the screen awake during an active trip
        </label>
      </section>
      <section className="card stack">
        <h2 className="screen-title">Backup</h2>
        <p className="muted">
          RoadTag stores trips only on this device. Export a backup before clearing site
          data or uninstalling.
        </p>
        <button
          type="button"
          className="button"
          onClick={() =>
            void shareOrDownloadJson("roadtag-backup.json", serializeAll(trips, settings))
          }
        >
          Export all data
        </button>
        <button type="button" className="button" onClick={() => fileRef.current?.click()}>
          Restore all data
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Restore all data from JSON"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) {
              return;
            }
            void file.text().then(setConfirmRestore);
          }}
        />
      </section>
      <section className="card stack">
        <h2 className="screen-title">About</h2>
        <p>
          {APP_NAME} {APP_VERSION}
        </p>
        <button type="button" className="button" onClick={() => setPrivacyOpen(true)}>
          Privacy
        </button>
      </section>
      {privacyOpen ? (
        <Dialog title="Privacy" onClose={() => setPrivacyOpen(false)}>
          <p>No location is collected.</p>
          <p>No photos are collected.</p>
          <p>No license-plate numbers are collected.</p>
          <p>No analytics or advertising is included.</p>
          <p>No game data is sent to a server.</p>
          <p>Trips and sightings remain in this device’s browser storage.</p>
          <p>
            Cloudflare Access handles sign-in separately from the app. Clearing site data
            or uninstalling the PWA may delete locally stored trips.
          </p>
        </Dialog>
      ) : null}
      {confirmRestore ? (
        <ConfirmDialog
          title="Replace all RoadTag data?"
          body="This overwrites every trip and setting on this device with the backup file."
          confirmLabel="Restore"
          danger
          onCancel={() => setConfirmRestore(null)}
          onConfirm={() => {
            const text = confirmRestore;
            setConfirmRestore(null);
            void onRestore(text).catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Restore failed.");
            });
          }}
        />
      ) : null}
    </main>
  );
}
