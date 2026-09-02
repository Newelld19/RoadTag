import type { SnackbarState } from "../hooks/useSnackbar";

interface Props {
  snackbar: SnackbarState;
  onDismiss: () => void;
}

export function Snackbar({ snackbar, onDismiss }: Props) {
  return (
    <div className="snackbar" role="status">
      <span>{snackbar.message}</span>
      <div className="row">
        {snackbar.onAction && snackbar.actionLabel ? (
          <button
            type="button"
            className="button snackbar-button"
            onClick={() => {
              snackbar.onAction?.();
              onDismiss();
            }}
          >
            {snackbar.actionLabel}
          </button>
        ) : null}
        <button type="button" className="button snackbar-button" onClick={onDismiss} aria-label="Tag it">
          Tag It!
        </button>
      </div>
    </div>
  );
}
