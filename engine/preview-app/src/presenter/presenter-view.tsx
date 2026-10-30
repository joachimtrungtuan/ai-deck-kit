import { useRef, useState } from "react";
import { runtimeDeckExportUrl } from "virtual:aideck-deck";
import type { PreviewSource } from "../preview-types";
import { ColumnSplitter } from "./column-splitter";
import { GoToSlideControl } from "./go-to-slide-control";
import { MirrorFrame, type MirrorSourceKind } from "./mirror-frame";
import { PLACEMENT_HINT, openAudienceWindow } from "./audience-window-placement";
import { RehearsalLogPanel } from "./rehearsal-log-panel";
import type { RehearsalRow } from "./rehearsal-log";
import type { ScreenMode, SlideSummary } from "./presenter-channel";
import { SlidePositionCaption } from "./slide-position-caption";
import type { ParsedSpeakerNotes } from "./speaker-notes-parser";
import { SpeakerNotesRenderer } from "./speaker-notes-renderer";
import { TalkClockBar } from "./talk-clock-bar";
import type { ClockState } from "./talk-clock-state";

export type NotesTheme = "dark" | "light";

const SPLIT_KEY = "aideck.present.columnSplit";
const DEFAULT_SPLIT = 58;
const MIN_FRAMES_PX = 360;
const MIN_NOTES_PX = 300;

function readSplit(): number {
  try { const value = Number(localStorage.getItem(SPLIT_KEY)); return value > 0 && value < 100 ? value : DEFAULT_SPLIT; } catch { return DEFAULT_SPLIT; }
}

export type PresenterViewProps = {
  audienceIndex: number;
  clock: ClockState;
  hasTargets: boolean;
  index: number;
  kind: MirrorSourceKind;
  nextIndex: number | null;
  notes: ParsedSpeakerNotes;
  notesTheme: NotesTheme;
  notesZoom: number;
  now: number;
  onAdjustClock: (deltaMs: number) => void;
  onClearRehearsal: () => void;
  onJump: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onExportState?: (slides: SlideSummary[]) => void;
  onResetClock: () => void;
  onToggleClock: () => void;
  onToggleFreeze: () => void;
  onToggleBlack: () => void;
  onToggleRehearsal: () => void;
  onZoomNotes: (direction: 1 | -1) => void;
  pace: { deltaSeconds: number; untimed: number };
  prevIndex: number | null;
  rehearsalRows: RehearsalRow[];
  rehearsing: boolean;
  screen: ScreenMode;
  source: PreviewSource;
  titles: string[];
};

/** The presenter's private window: audience mirror, neighbouring slides, notes, clocks and controls. */
export function PresenterView(props: PresenterViewProps) {
  const { audienceIndex, index, kind, notes, source, titles } = props;
  const [hint, setHint] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [split, setSplit] = useState(readSplit);
  const mainRef = useRef<HTMLDivElement>(null);
  const frozen = props.screen === "frozen";
  const browsing = frozen && index !== audienceIndex;
  // While frozen, the presenter browses ahead privately; that slide takes the "next" slot.
  const sideNext = browsing ? index : props.nextIndex;

  const changeSplit = (percent: number) => {
    setSplit(percent);
    try { localStorage.setItem(SPLIT_KEY, String(percent)); } catch { /* storage unavailable */ }
  };
  const openAudience = async () => {
    const url = `${window.location.pathname}?audience${kind === "export" ? "&source=export" : ""}`;
    const { opened, placement } = await openAudienceWindow(url);
    setHint(opened ? PLACEMENT_HINT[placement.reason] : "The browser blocked the audience window. Allow pop-ups for this page and try again.");
  };
  const sideFrame = (slide: number | null, label: string) => <figure className="present-frame present-frame-side">
    <div className="present-frame-box">{slide !== null ? <MirrorFrame exportUrl={runtimeDeckExportUrl} index={slide} kind={kind} source={source} still /> : <p className="mirror-frame-missing">—</p>}</div>
    <figcaption title={slide !== null ? titles[slide] : undefined}>{slide !== null ? `${label} · ${slide + 1} · ${titles[slide]}` : `${label} · none`}</figcaption>
  </figure>;

  return <div className="present-view">
    <p className="present-banner" role="note">PRESENTER ONLY — do not share this window</p>
    <div className="present-main" ref={mainRef}>
      <div className="present-frames" style={{ flexBasis: `${split}%` }}>
        <figure className="present-frame present-frame-current">
          <SlidePositionCaption index={audienceIndex} label={props.screen !== "live" ? props.screen : undefined} title={titles[audienceIndex]} total={source.slides.length} />
          <div className="present-frame-box"><MirrorFrame exportUrl={runtimeDeckExportUrl} index={audienceIndex} kind={kind} onExportState={props.onExportState ? (slides) => props.onExportState?.(slides) : undefined} source={source} /></div>
        </figure>
        <div className="present-frame-row">
          {sideFrame(props.prevIndex, "Previous")}
          {sideFrame(sideNext, browsing ? "Browsing" : "Next")}
        </div>
      </div>
      <ColumnSplitter containerRef={mainRef} minLeftPx={MIN_FRAMES_PX} minRightPx={MIN_NOTES_PX} onChange={changeSplit} percent={split} />
      <section className="present-notes-card" data-theme={props.notesTheme}>
        <header>
          {notes.pacing && <span className={`present-pacing present-pacing-${notes.pacing.toLowerCase()}`}>{notes.pacing}</span>}
          {notes.targetSeconds !== undefined && <span>Target {Math.floor(notes.targetSeconds / 60)}:{String(notes.targetSeconds % 60).padStart(2, "0")}</span>}
          {notes.cue && <span className="present-cue">Cue: {notes.cue}</span>}
          {notes.invalid.length > 0 && <span className="present-invalid" title={notes.invalid.join("\n")}>header warning</span>}
          <span className="present-notes-zoom" role="group" aria-label="Notes text size">
            <button aria-label="Smaller notes text" onClick={() => props.onZoomNotes(-1)} title="Smaller text (−)" type="button">A−</button>
            <span>{Math.round(props.notesZoom * 100)}%</span>
            <button aria-label="Larger notes text" onClick={() => props.onZoomNotes(1)} title="Larger text (+)" type="button">A+</button>
          </span>
        </header>
        <div className="present-notes" style={{ fontSize: `${props.notesZoom}em` }}><SpeakerNotesRenderer markdown={notes.body} /></div>
      </section>
    </div>
    <footer className="present-bar">
      <TalkClockBar clock={props.clock} hasTargets={props.hasTargets} now={props.now} onAdjust={props.onAdjustClock} onReset={props.onResetClock} onToggle={props.onToggleClock} pace={props.pace} />
      <div className="present-controls">
        <button onClick={props.onPrev} type="button">← Prev</button>
        <button onClick={props.onNext} type="button">Next →</button>
        <GoToSlideControl index={index} onJump={props.onJump} titles={titles} />
        <button aria-pressed={props.screen === "black"} onClick={props.onToggleBlack} type="button">Black (B)</button>
        <button aria-pressed={frozen} onClick={props.onToggleFreeze} type="button">Freeze (F)</button>
        <button onClick={openAudience} type="button">Open audience window</button>
        <button aria-pressed={showLog} onClick={() => setShowLog((v) => !v)} type="button">Rehearsal log{props.rehearsing ? " ●" : ""}</button>
        {hint && <span className="present-hint" role="status">{hint}</span>}
      </div>
    </footer>
    {showLog && <RehearsalLogPanel onClear={props.onClearRehearsal} onClose={() => setShowLog(false)} onToggleRecording={props.onToggleRehearsal} recording={props.rehearsing} rows={props.rehearsalRows} />}
  </div>;
}
