import { runtimeServerRunId } from "virtual:aideck-deck";

export const NOTES_ZOOM_STEPS = [0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.8, 2.2];
const KEY = "aideck.present.notesZoom";

// The zoom is tagged with the dev server's run id, so it applies across slides and reloads but
// resets once that server stops. A build has no run id and keeps the zoom for the page's lifetime.
export function readNotesZoom(): number {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { run?: unknown; zoom?: unknown } | null;
    if (runtimeServerRunId !== null && saved?.run === runtimeServerRunId && NOTES_ZOOM_STEPS.includes(saved.zoom as number)) return saved.zoom as number;
  } catch { /* storage unavailable or malformed */ }
  return 1;
}

export function stepNotesZoom(zoom: number, direction: 1 | -1): number {
  const at = Math.max(0, NOTES_ZOOM_STEPS.indexOf(zoom));
  const next = NOTES_ZOOM_STEPS[Math.max(0, Math.min(NOTES_ZOOM_STEPS.length - 1, at + direction))];
  if (runtimeServerRunId !== null) {
    try { localStorage.setItem(KEY, JSON.stringify({ run: runtimeServerRunId, zoom: next })); } catch { /* storage unavailable */ }
  }
  return next;
}
