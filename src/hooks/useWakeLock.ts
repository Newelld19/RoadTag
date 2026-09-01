import { useEffect } from "react";

export function useWakeLock(enabled: boolean, activeTrip: boolean): void {
  useEffect(() => {
    if (!enabled || !activeTrip || !("wakeLock" in navigator)) {
      return;
    }
    let cancelled = false;
    let sentinel: WakeLockSentinel | null = null;

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        sentinel = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled) {
        void request();
      }
    };

    void request();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel?.release();
    };
  }, [activeTrip, enabled]);
}
