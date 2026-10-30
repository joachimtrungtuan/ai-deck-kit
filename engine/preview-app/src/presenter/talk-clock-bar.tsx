import { elapsedMs, formatClock, formatPace, type ClockState } from "./talk-clock-state";

type Pace = { deltaSeconds: number; untimed: number };

const ADJUSTMENTS = [-10, -5, -1, 1, 5, 10];
const SCHEDULE_HELP = "Compares the talk timer with the sum of the target times (target: in the speaker notes) of the slides before this one. "
  + "\"on pace\" means you reached this slide exactly on schedule; \"behind\" means you are running over, \"ahead\" means you have time in hand.";

/** Wall clock, talk timer with controls, and the schedule against the slides' target times. */
export function TalkClockBar({ clock, hasTargets, now, onAdjust, onReset, onToggle, pace }: {
  clock: ClockState;
  hasTargets: boolean;
  now: number;
  onAdjust: (deltaMs: number) => void;
  onReset: () => void;
  onToggle: () => void;
  pace: Pace;
}) {
  const wall = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const tone = pace.deltaSeconds > 0 ? "behind" : pace.deltaSeconds < 0 ? "ahead" : "even";
  const untimedNote = pace.untimed ? ` ${pace.untimed} earlier slide(s) have no target and count as zero (marked *).` : "";
  return <div className="present-clock" role="group" aria-label="Talk clock">
    <span className="present-clock-wall" title="Time of day">{wall}</span>
    <strong aria-label="Elapsed" className="present-clock-elapsed" title="Talk timer">{formatClock(elapsedMs(clock, now))}</strong>
    <button onClick={onToggle} type="button">{clock.running ? "Pause" : "Start"}</button>
    {ADJUSTMENTS.map((minutes) => <button key={minutes} onClick={() => onAdjust(minutes * 60000)} title={`${minutes > 0 ? "Add" : "Take off"} ${Math.abs(minutes)} minute(s)`} type="button">{minutes > 0 ? `+${minutes}` : `−${-minutes}`}m</button>)}
    <button onClick={onReset} type="button">Reset</button>
    {hasTargets
      ? <span className={`present-pace present-pace-${tone}`} title={SCHEDULE_HELP + untimedNote}>Schedule: <strong>{formatPace(pace.deltaSeconds)}</strong>{pace.untimed ? " *" : ""}</span>
      : <span className="present-pace" title="Add target: m:ss to a slide's speaker-notes header to track the schedule.">Schedule: no targets set</span>}
  </div>;
}
