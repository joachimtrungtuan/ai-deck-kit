// Talk clock: pure reducers over {startedAt, accumulatedMs, running} so a reload resumes the same elapsed time.
export type ClockState = { startedAt: number | null; accumulatedMs: number; running: boolean };

export const INITIAL_CLOCK: ClockState = { startedAt: null, accumulatedMs: 0, running: false };

export function elapsedMs(state: ClockState, now: number): number {
  const live = state.running && state.startedAt !== null ? now - state.startedAt : 0;
  return Math.max(0, state.accumulatedMs + live);
}

export function startClock(state: ClockState, now: number): ClockState {
  return state.running ? state : { startedAt: now, accumulatedMs: state.accumulatedMs, running: true };
}

export function pauseClock(state: ClockState, now: number): ClockState {
  return { startedAt: null, accumulatedMs: elapsedMs(state, now), running: false };
}

export function adjustClock(state: ClockState, deltaMs: number, now: number): ClockState {
  const elapsed = Math.max(0, elapsedMs(state, now) + deltaMs);
  return state.running ? { startedAt: now, accumulatedMs: elapsed, running: true } : { startedAt: null, accumulatedMs: elapsed, running: false };
}

export function formatClock(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/** Positive delta = behind plan. Slides without a target add nothing and are counted as untimed. */
export function paceAgainstTargets(targets: ReadonlyArray<number | undefined>, currentIndex: number, elapsed: number) {
  const before = targets.slice(0, currentIndex);
  const plannedSeconds = before.reduce<number>((sum, target) => sum + (target ?? 0), 0);
  return { deltaSeconds: Math.round(elapsed / 1000) - plannedSeconds, untimed: before.filter((target) => target === undefined).length };
}

export function formatPace(deltaSeconds: number): string {
  if (deltaSeconds === 0) return "on pace";
  return `${formatClock(Math.abs(deltaSeconds) * 1000)} ${deltaSeconds > 0 ? "behind" : "ahead"}`;
}

type ClockStorage = Pick<Storage, "getItem" | "setItem">;
const key = (deckId: string) => `aideck.present.clock--${deckId}`;

export function readClock(storage: ClockStorage, deckId: string): ClockState {
  try {
    const value = JSON.parse(storage.getItem(key(deckId)) ?? "null");
    const valid = value && typeof value.accumulatedMs === "number" && typeof value.running === "boolean" && (value.startedAt === null || typeof value.startedAt === "number");
    return valid ? { startedAt: value.startedAt, accumulatedMs: value.accumulatedMs, running: value.running } : INITIAL_CLOCK;
  } catch { return INITIAL_CLOCK; }
}

export function writeClock(storage: ClockStorage, deckId: string, state: ClockState): void {
  try { storage.setItem(key(deckId), JSON.stringify(state)); } catch { /* storage unavailable: clock just won't survive a reload */ }
}
