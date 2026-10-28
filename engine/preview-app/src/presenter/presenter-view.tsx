import { useState } from "react";
import { runtimeDeckExportUrl } from "virtual:aideck-deck";
import type { PreviewSource } from "../preview-types";
import { MirrorFrame, type MirrorSourceKind } from "./mirror-frame";
import { PLACEMENT_HINT, openAudienceWindow } from "./audience-window-placement";
import { RehearsalLogPanel } from "./rehearsal-log-panel";
import type { RehearsalRow } from "./rehearsal-log";
import type { ScreenMode } from "./presenter-channel";
import type { ParsedSpeakerNotes } from "./speaker-notes-parser";
import { SpeakerNotesRenderer } from "./speaker-notes-renderer";
import { TalkClockBar } from "./talk-clock-bar";
import type { ClockState } from "./talk-clock-state";

export type NotesTheme = "dark" | "light";

export type PresenterViewProps = {
  audienceIndex: number;
  clock: ClockState;
  index: number;
  kind: MirrorSourceKind;
  nextIndex: number | null;
  notes: ParsedSpeakerNotes;
  notesTheme: NotesTheme;
  notesZoom: number;
  now: number;
  onAdjustClock: (deltaMs: number) => void;
  onJump: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onResetClock: () => void;
  onToggleClock: () => void;
  onToggleFreeze: () => void;
  onToggleBlack: () => void;
  pace: { deltaSeconds: number; untimed: number };
  rehearsalRows: RehearsalRow[];
  screen: ScreenMode;
  source: PreviewSource;
};

/** The presenter's private window: audience mirror, next frame, notes, clocks and controls. */
export function PresenterView(props: PresenterViewProps) {
  const { audienceIndex, index, kind, nextIndex, notes, source } = props;
  const [jump, setJump] = useState("");
  const [hint, setHint] = useState("");
  const [showLog, setShowLog] = useState(false);
  const frozen = props.screen === "frozen";
  const browsing = frozen && index !== audienceIndex;
  const secondIndex = browsing ? index : nextIndex;

  const openAudience = async () => {
    const url = `${window.location.pathname}?audience${kind === "export" ? "&source=export" : ""}`;
    const { opened, placement } = await openAudienceWindow(url);
    setHint(opened ? PLACEMENT_HINT[placement.reason] : "The browser blocked the audience window. Allow pop-ups for this page and try again.");
  };
  const submitJump = () => {
    const target = Number.parseInt(jump, 10);
    if (Number.isFinite(target)) props.onJump(target - 1);
    setJump("");
  };

  return <div className="present-view">
    <p className="present-banner" role="note">PRESENTER ONLY — do not share this window</p>
    <div className="present-frames">
      <figure className="present-frame"><div className="present-frame-box"><MirrorFrame exportUrl={runtimeDeckExportUrl} index={audienceIndex} kind={kind} source={source} /></div>
        <figcaption>Audience · {audienceIndex + 1}/{source.slides.length}{props.screen !== "live" ? ` · ${props.screen}` : ""}</figcaption></figure>
      {secondIndex !== null && <figure className="present-frame present-frame-next"><div className="present-frame-box"><MirrorFrame exportUrl={runtimeDeckExportUrl} index={secondIndex} kind={kind} source={source} /></div>
        <figcaption>{browsing ? `Browsing · ${secondIndex + 1}` : `Next · ${secondIndex + 1}`}</figcaption></figure>}
    </div>
    <section className="present-notes-card" data-theme={props.notesTheme}>
      <header>
        {notes.pacing && <span className={`present-pacing present-pacing-${notes.pacing.toLowerCase()}`}>{notes.pacing}</span>}
        {notes.targetSeconds !== undefined && <span>Target {Math.floor(notes.targetSeconds / 60)}:{String(notes.targetSeconds % 60).padStart(2, "0")}</span>}
        {notes.cue && <span className="present-cue">Cue: {notes.cue}</span>}
        {notes.invalid.length > 0 && <span className="present-invalid" title={notes.invalid.join("\n")}>header warning</span>}
      </header>
      <div className="present-notes" style={{ fontSize: `${props.notesZoom}em` }}><SpeakerNotesRenderer markdown={notes.body} /></div>
    </section>
    <TalkClockBar clock={props.clock} now={props.now} onAdjust={props.onAdjustClock} onReset={props.onResetClock} onToggle={props.onToggleClock} pace={props.pace} />
    <div className="present-controls">
      <button onClick={props.onPrev} type="button">← Prev</button>
      <button onClick={props.onNext} type="button">Next →</button>
      <label>Go to <input aria-label="Jump to slide" inputMode="numeric" onChange={(e) => setJump(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitJump(); }} size={3} value={jump} /></label>
      <button aria-pressed={props.screen === "black"} onClick={props.onToggleBlack} type="button">Black (B)</button>
      <button aria-pressed={frozen} onClick={props.onToggleFreeze} type="button">Freeze (F)</button>
      <button onClick={openAudience} type="button">Open audience window</button>
      <button onClick={() => setShowLog((v) => !v)} type="button">Rehearsal log</button>
    </div>
    {hint && <p className="present-hint" role="status">{hint}</p>}
    {showLog && <RehearsalLogPanel onClose={() => setShowLog(false)} rows={props.rehearsalRows} />}
  </div>;
}
