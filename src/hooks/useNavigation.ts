import { useCallback, useEffect, useState } from "react";

export type ScreenName =
  "home" | "create" | "game" | "map" | "details" | "settings" | "jurisdiction";

export interface Screen {
  name: ScreenName;
  tripId?: string;
  code?: string;
  from?: "game" | "map" | "details";
}

interface HistoryState {
  roadtag: true;
  stack: Screen[];
}

function isHistoryState(value: unknown): value is HistoryState {
  return Boolean(value && typeof value === "object" && (value as HistoryState).roadtag);
}

export function useNavigation() {
  const [stack, setStack] = useState<Screen[]>([{ name: "home" }]);

  useEffect(() => {
    const initial: HistoryState = { roadtag: true, stack: [{ name: "home" }] };
    window.history.replaceState(initial, "", window.location.pathname);

    const onPop = (event: PopStateEvent) => {
      if (isHistoryState(event.state) && event.state.stack.length > 0) {
        setStack(event.state.stack);
        return;
      }
      setStack([{ name: "home" }]);
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const current = stack[stack.length - 1] ?? { name: "home" as const };

  const push = useCallback((screen: Screen) => {
    setStack((prev) => {
      const next = [...prev, screen];
      window.history.pushState({ roadtag: true, stack: next } satisfies HistoryState, "");
      return next;
    });
  }, []);

  const replace = useCallback((screen: Screen) => {
    setStack((prev) => {
      const next = [...prev.slice(0, -1), screen];
      window.history.replaceState(
        { roadtag: true, stack: next } satisfies HistoryState,
        "",
      );
      return next;
    });
  }, []);

  const back = useCallback(() => {
    if (
      window.history.state &&
      isHistoryState(window.history.state) &&
      stack.length > 1
    ) {
      window.history.back();
      return;
    }
    setStack([{ name: "home" }]);
  }, [stack.length]);

  const goHome = useCallback(() => {
    const next: Screen[] = [{ name: "home" }];
    window.history.pushState({ roadtag: true, stack: next } satisfies HistoryState, "");
    setStack(next);
  }, []);

  return { stack, current, push, replace, back, goHome };
}
