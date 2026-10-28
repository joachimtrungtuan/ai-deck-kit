import { elapsedMs, formatClock, formatPace, type ClockState } from "./talk-clock-state";

type Pace = { deltaSeconds: number; untimed: number };

/** Wall clock, talk timer with controls, and pace against the slides' target times. */
export function TalkClockBar({ clock, now, onAdjust, onReset, onToggle, pace }: {
  clock: ClockState;
  now: number;
  onAdjust: (deltaMs: number) => void;
  onReset: () => void;
  onToggle: () => void;
  pace: Pace;
}) {
  const wall = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return <div className="present-clock" role="group" aria-label="Talk clock">
    <span title="Time of day">{wall}</span>
    <strong aria-label="Elapsed" className="present-clock-elapsed">{formatClock(elapsedMs(clock, now))}</strong>
    <button onClick={onToggle} type="button">{clock.running ? "Pause" : "Start"}</button>
    <button onClick={() => onAdjust(-60000)} title="Take a minute off" type="button">−1m</button>
    <button onClick={() => onAdjust(60000)} title="Add a minute" type="button">+1m</button>
    <button onClick={onReset} type="button">Reset</button>
    <span className="present-pace" title={pace.untimed ? `${pace.untimed} slide(s) before this have no target` : "Against slide targets"}>{formatPace(pace.deltaSeconds)}{pace.untimed ? " *" : ""}</span>
  </div>;
}
