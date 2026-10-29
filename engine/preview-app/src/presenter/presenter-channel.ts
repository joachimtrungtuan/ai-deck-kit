// Two-window sync: the presenter owns the position, every other window mirrors it. Pure message
// logic lives here (no DOM) so ordering rules are unit-testable; the BroadcastChannel wrapper is thin.

export type ScreenMode = "live" | "black" | "frozen";
export type SlideSummary = { id: string; tocTitle?: string; type: string };

export type PresenterMessage =
  | { kind: "hello" }
  | { kind: "goto"; index: number; seq: number }
  | { kind: "state"; index: number; seq: number; total: number; slides: SlideSummary[] }
  | { kind: "screen"; mode: ScreenMode };

const SCREEN_MODES: ScreenMode[] = ["live", "black", "frozen"];

export function channelName(deckId: string): string {
  return `aideck-present:${deckId}`;
}

/** Monotonic even if the clock stalls or two messages share a millisecond. */
export function nextSeq(previous: number, now: number = Date.now()): number {
  return Math.max(now, previous + 1);
}

/** A message older than (or equal to) the last applied one never wins. */
export function isFresh(lastApplied: number, incoming: number): boolean {
  return incoming > lastApplied;
}

export function isPresenterMessage(value: unknown): value is PresenterMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  switch (message.kind) {
    case "hello": return true;
    case "goto": return Number.isInteger(message.index) && typeof message.seq === "number";
    case "state": return Number.isInteger(message.index) && typeof message.seq === "number"
      && Number.isInteger(message.total) && Array.isArray(message.slides);
    case "screen": return SCREEN_MODES.includes(message.mode as ScreenMode);
    default: return false;
  }
}

/** Collapses a burst of requests into one call with the latest value (e.g. held arrow key). */
export function createLatestWins<T>(apply: (value: T) => void, schedule: (run: () => void) => void) {
  let pending: { value: T } | null = null;
  return (value: T) => {
    const wasIdle = pending === null;
    pending = { value };
    if (wasIdle) schedule(() => { const next = pending; pending = null; if (next) apply(next.value); });
  };
}

export type PresenterChannel = { post: (message: PresenterMessage) => void; close: () => void };

export function openPresenterChannel(deckId: string, onMessage: (message: PresenterMessage) => void): PresenterChannel {
  const channel = new BroadcastChannel(channelName(deckId));
  channel.onmessage = (event) => { if (isPresenterMessage(event.data)) onMessage(event.data); };
  return { post: (message) => channel.postMessage(message), close: () => channel.close() };
}
