import { useCallback, useEffect, useState } from "react";

export function usePwaUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateFn, setUpdateFn] = useState<(() => void) | null>(null);
  const [swError, setSwError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void import("virtual:pwa-register")
      .then(({ registerSW }) => {
        if (cancelled) {
          return;
        }
        const update = registerSW({
          immediate: true,
          onNeedRefresh() {
            setNeedRefresh(true);
          },
          onOfflineReady() {
            setOfflineReady(true);
          },
          onRegisterError() {
            setSwError(
              "RoadTag could not finish installing offline support. The game still works online.",
            );
          },
        });
        setUpdateFn(() => () => {
          void update(true);
        });
      })
      .catch(() => {
        if (!cancelled && import.meta.env.PROD) {
          setSwError(
            "RoadTag could not register its service worker. Install and offline mode may be unavailable.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyUpdate = useCallback(() => {
    updateFn?.();
  }, [updateFn]);

  const dismissOfflineReady = useCallback(() => setOfflineReady(false), []);
  const dismissRefresh = useCallback(() => setNeedRefresh(false), []);

  return {
    needRefresh,
    offlineReady,
    swError,
    applyUpdate,
    dismissOfflineReady,
    dismissRefresh,
  };
}
