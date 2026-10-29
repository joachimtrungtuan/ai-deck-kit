export type PresenterKeyAction = "next" | "prev" | "first" | "last" | "black" | "freeze" | "theme" | "zoom-in" | "zoom-out";

export type PresenterKeyEvent = { key: string; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; inEditable?: boolean };

const BY_KEY: Record<string, PresenterKeyAction> = {
  ArrowRight: "next", ArrowDown: "next", PageDown: "next", " ": "next",
  ArrowLeft: "prev", ArrowUp: "prev", PageUp: "prev",
  Home: "first", End: "last",
  b: "black", f: "freeze", t: "theme",
  "+": "zoom-in", "=": "zoom-in", "-": "zoom-out",
};

/** Maps a key press to a presenter action; typing in a field or using a shortcut modifier maps to nothing. */
export function presenterKeyAction(event: PresenterKeyEvent): PresenterKeyAction | null {
  if (event.inEditable || event.altKey || event.ctrlKey || event.metaKey) return null;
  return BY_KEY[event.key.length === 1 ? event.key.toLowerCase() : event.key] ?? null;
}
