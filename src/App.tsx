import { useEffect, useRef, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { Snackbar } from "./components/Snackbar";
import { Dialog } from "./components/Dialog";
import { useNavigation } from "./hooks/useNavigation";
import { usePwaUpdate } from "./hooks/usePwaUpdate";
import { useSnackbar } from "./hooks/useSnackbar";
import { useStore } from "./hooks/useStore";
import { useTheme } from "./hooks/useTheme";
import { useWakeLock } from "./hooks/useWakeLock";
import { CreateTripPage } from "./pages/CreateTripPage";
import { GamePage } from "./pages/GamePage";
import { HomePage } from "./pages/HomePage";
import { MapPage } from "./pages/MapPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TripDetailsPage } from "./pages/TripDetailsPage";
import { isUsFiftyComplete, usFiftyProgress } from "./services/scoring";
import { JURISDICTION_BY_CODE } from "./data/jurisdictions";

export default function App() {
  const nav = useNavigation();
  const store = useStore();
  const snack = useSnackbar();
  const pwa = usePwaUpdate();
  const [savedHint, setSavedHint] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const previousUs = useRef<number | null>(null);

  useTheme(store.settings);
  const trip = store.tripById(nav.current.tripId);
  const tripActive = Boolean(trip && !trip.finished && nav.current.name !== "home");
  useWakeLock(store.settings.wakeLock, tripActive);

  useEffect(() => {
    if (!trip) {
      return;
    }
    const us = usFiftyProgress(trip);
    const count = us?.spotted ?? 0;
    if (
      previousUs.current !== null &&
      previousUs.current < 50 &&
      count === 50 &&
      isUsFiftyComplete(trip)
    ) {
      setCelebrate(true);
    }
    previousUs.current = count;
  }, [trip]);

  function flashSaved() {
    setSavedHint(true);
    window.setTimeout(() => setSavedHint(false), 1200);
  }

  async function spot(tripId: string, code: string) {
    const next = await store.spot(tripId, code);
    flashSaved();
    const name = JURISDICTION_BY_CODE[code]?.name ?? code;
    setLiveMessage(`${name} tagged`);
    snack.show({
      message: `${name} tagged`,
      actionLabel: "Opps",
      onAction: () => {
        void store.unspot(tripId, code);
      },
    });
    if (isUsFiftyComplete(next)) {
      setCelebrate(true);
    }
  }

  const tripScreen =
    nav.current.name === "game" ||
    nav.current.name === "map" ||
    nav.current.name === "details";

  return (
    <div className={`app-shell ${tripScreen ? "has-nav" : ""}`}>
      <div className="live-region" aria-live="polite">
        {liveMessage}
      </div>
      {pwa.needRefresh ? (
        <div className="update-banner">
          <p>Update available. Apply it when you are not in the middle of spotting.</p>
          <div className="row">
            <button type="button" className="button primary" onClick={pwa.applyUpdate}>
              Update now
            </button>
            <button type="button" className="button" onClick={pwa.dismissRefresh}>
              Later
            </button>
          </div>
        </div>
      ) : null}
      {pwa.offlineReady ? (
        <div className="update-banner">
          <p>RoadTag is ready to use offline.</p>
          <button type="button" className="button" onClick={pwa.dismissOfflineReady}>
            OK
          </button>
        </div>
      ) : null}
      {pwa.swError ? <p className="error-banner">{pwa.swError}</p> : null}
      {store.status === "loading" ? <p>Loading trips…</p> : null}
      {nav.current.name === "home" ? (
        <HomePage
          trips={store.trips}
          statusMessage={store.message}
          onCreate={() => nav.push({ name: "create" })}
          onOpen={(id) => nav.push({ name: "game", tripId: id })}
          onSettings={() => nav.push({ name: "settings" })}
          onImportTrip={async (text) => {
            await store.importFromText(text, "trip");
            flashSaved();
          }}
        />
      ) : null}
      {nav.current.name === "create" ? (
        <CreateTripPage
          onBack={nav.back}
          onCreate={async (input) => {
            const created = await store.createTrip(input);
            nav.replace({ name: "game", tripId: created.id });
          }}
        />
      ) : null}
      {nav.current.name === "settings" ? (
        <SettingsPage
          settings={store.settings}
          trips={store.trips}
          onBack={nav.back}
          onSave={store.saveSettings}
          onRestore={async (text) => {
            await store.importFromText(text, "full");
            flashSaved();
          }}
        />
      ) : null}
      {trip && nav.current.name === "game" ? (
        <GamePage
          trip={trip}
          spottedSort={store.settings.spottedSort}
          savedHint={savedHint}
          onBack={nav.goHome}
          onSpot={(code) => spot(trip.id, code)}
          onUnspot={async (code) => {
            await store.unspot(trip.id, code);
            flashSaved();
          }}
          onNote={async (code, note) => {
            await store.setNote(trip.id, code, note);
            flashSaved();
          }}
        />
      ) : null}
      {trip && nav.current.name === "map" ? (
        <MapPage
          trip={trip}
          onBack={nav.goHome}
          onSpot={(code) => spot(trip.id, code)}
          onUnspot={async (code) => {
            await store.unspot(trip.id, code);
            flashSaved();
          }}
          onNote={async (code, note) => {
            await store.setNote(trip.id, code, note);
            flashSaved();
          }}
        />
      ) : null}
      {trip && nav.current.name === "details" ? (
        <TripDetailsPage
          trip={trip}
          onBack={nav.goHome}
          onRename={async (name) => {
            await store.rename(trip.id, name);
          }}
          onFinish={async () => {
            await store.finish(trip.id);
          }}
          onReopen={async () => {
            await store.reopen(trip.id);
          }}
          onReset={async () => {
            await store.reset(trip.id);
          }}
          onDelete={async () => {
            await store.remove(trip.id);
            nav.goHome();
          }}
          onAddPacks={async (packIds) => {
            await store.addPacks(trip.id, packIds);
          }}
        />
      ) : null}
      {tripScreen && trip ? (
        <BottomNav
          current={
            nav.current.name === "map"
              ? "map"
              : nav.current.name === "details"
                ? "details"
                : "game"
          }
          onGame={() => nav.replace({ name: "game", tripId: trip.id })}
          onMap={() => nav.replace({ name: "map", tripId: trip.id })}
          onDetails={() => nav.replace({ name: "details", tripId: trip.id })}
        />
      ) : null}
      {snack.snackbar ? (
        <Snackbar snackbar={snack.snackbar} onDismiss={snack.hide} />
      ) : null}
      {celebrate ? (
        <Dialog title="50 states" onClose={() => setCelebrate(false)}>
          <p>Every U.S. state in this trip is tagged. Optional packs are separate.</p>
          <button
            type="button"
            className="button primary"
            onClick={() => setCelebrate(false)}
          >
            Nice
          </button>
        </Dialog>
      ) : null}
    </div>
  );
}
