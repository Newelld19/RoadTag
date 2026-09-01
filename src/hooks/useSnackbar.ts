import { useCallback, useState } from "react";

export interface SnackbarState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  const show = useCallback((next: SnackbarState) => {
    setSnackbar(next);
  }, []);

  const hide = useCallback(() => setSnackbar(null), []);

  return { snackbar, show, hide };
}
