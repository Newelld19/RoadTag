interface Props {
  current: "game" | "map" | "details";
  onGame: () => void;
  onMap: () => void;
  onDetails: () => void;
}

export function BottomNav({ current, onGame, onMap, onDetails }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Trip">
      <button
        type="button"
        className={current === "game" ? "active" : ""}
        onClick={onGame}
      >
        Game
      </button>
      <button type="button" className={current === "map" ? "active" : ""} onClick={onMap}>
        Map
      </button>
      <button
        type="button"
        className={current === "details" ? "active" : ""}
        onClick={onDetails}
      >
        Trip
      </button>
    </nav>
  );
}
