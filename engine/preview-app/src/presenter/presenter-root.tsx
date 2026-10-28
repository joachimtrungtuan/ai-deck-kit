import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { runtimeDeckExportUrl } from "virtual:aideck-deck";
import { readActiveSlideIndex, rememberActiveSlide } from "../active-slide-memory";
import type { PreviewSource } from "../preview-types";
import { MirrorFrame, type MirrorSourceKind } from "./mirror-frame";
import { nextSeq, openPresenterChannel, type PresenterChannel, type ScreenMode } from "./presenter-channel";
import { presenterKeyAction } from "./presenter-keyboard";
import { writeResumeIndex } from "./presenter-resume";
import { PresenterView, type NotesTheme } from "./presenter-view";
import { recordVisit, rehearsalRows, type RehearsalLog } from "./rehearsal-log";
import { nextPresentableIndex, parseSpeakerNotes } from "./speaker-notes-parser";
import { adjustClock, elapsedMs, INITIAL_CLOCK, paceAgainstTargets, pauseClock, readClock, startClock, writeClock } from "./talk-clock-state";
import { ViewSwitcher, type PresenterViewKind } from "./view-switcher";
import "./presenter-view.css";

const EXPORT_EDITOR_HINT = "Editing needs live mode; restart without --export";
const ZOOM_STEPS = [0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.8, 2.2];

function stored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try { const value = localStorage.getItem(key) as T | null; return value && allowed.includes(value) ? value : fallback; } catch { return fallback; }
}
function persist(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } }

/**
 * Owns presenter state (position, screen mode, clocks, rehearsal log) and the channel to the audience
 * window, so switching between Presenter, Editor and Slide never drops either.
 */
export function PresenterRoot({ kind, renderEditor, source }: {
  kind: MirrorSourceKind;
  renderEditor: (onDirtyChange: (dirty: boolean) => void) => ReactNode;
  source: PreviewSource;
}) {
  const slides = source.slides;
  const total = slides.length;
  const clamp = useCallback((value: number) => Math.max(0, Math.min(total - 1, value)), [total]);
  const [view, setView] = useState<PresenterViewKind>("presenter");
  const [index, setIndex] = useState(() => clamp(readActiveSlideIndex(source)));
  const [screen, setScreen] = useState<ScreenMode>("live");
  const [frozenAt, setFrozenAt] = useState<number | null>(null);
  const [clock, setClock] = useState(() => readClock(localStorage, source.id));
  const [now, setNow] = useState(() => Date.now());
  const [log, setLog] = useState<RehearsalLog>([]);
  const [theme, setTheme] = useState<NotesTheme>(() => stored("aideck.present.notesTheme", ["dark", "light"], "dark"));
  const [zoomStep, setZoomStep] = useState(() => Number(stored("aideck.present.notesZoom", ZOOM_STEPS.map(String), "1")));
  const channel = useRef<PresenterChannel | null>(null);
  const seq = useRef(0);
  const visit = useRef({ slideId: slides[index]?.id ?? "", at: Date.now() });
  const editorDirty = useRef(false);

  const parsed = useMemo(() => slides.map((slide) => parseSpeakerNotes(slide.speakerNotes)), [slides]);
  const pacings = useMemo(() => parsed.map((notes) => notes.pacing), [parsed]);
  const latest = useRef({ index, screen });
  latest.current = { index, screen };

  const postState = useCallback(() => {
    seq.current = nextSeq(seq.current);
    channel.current?.post({ kind: "state", index: latest.current.index, seq: seq.current, total, slides: slides.map(({ id, tocTitle, type }, i) => ({ id: id ?? String(i), tocTitle, type })) });
    channel.current?.post({ kind: "screen", mode: latest.current.screen });
  }, [slides, total]);

  useEffect(() => {
    const opened = openPresenterChannel(source.id, (message) => { if (message.kind === "hello") postState(); });
    channel.current = opened;
    postState();
    return () => { opened.close(); channel.current = null; };
  }, [postState, source.id]);

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { try { writeClock(localStorage, source.id, clock); } catch { /* storage unavailable */ } }, [clock, source.id]);

  const goTo = useCallback((target: number) => {
    const next = clamp(target);
    const at = Date.now();
    if (next !== latest.current.index) setLog((current) => recordVisit(current, visit.current.slideId, at - visit.current.at));
    visit.current = { slideId: slides[next].id ?? "", at };
    setIndex(next);
    rememberActiveSlide(source, next);
    try { writeResumeIndex(localStorage, source.id, next); } catch { /* storage unavailable */ }
    seq.current = nextSeq(seq.current);
    channel.current?.post({ kind: "goto", index: next, seq: seq.current });
  }, [clamp, slides, source]);

  const changeScreen = useCallback((mode: ScreenMode) => {
    setScreen(mode);
    setFrozenAt(mode === "frozen" ? latest.current.index : null);
    channel.current?.post({ kind: "screen", mode });
  }, []);
  const toggleScreen = (mode: "black" | "frozen") => changeScreen(latest.current.screen === mode ? "live" : mode);

  const toggleClock = useCallback(() => setClock((c) => (c.running ? pauseClock(c, Date.now()) : startClock(c, Date.now()))), []);
  const step = useCallback((direction: 1 | -1) => {
    if (direction === 1) setClock((c) => (c.running || elapsedMs(c, Date.now()) > 0 ? c : startClock(c, Date.now())));
    goTo(nextPresentableIndex(pacings, latest.current.index, direction));
  }, [goTo, pacings]);

  useEffect(() => {
    if (view === "editor") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inEditable = Boolean(target && (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable));
      const action = presenterKeyAction({ key: event.key, altKey: event.altKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey, inEditable });
      if (!action) return;
      event.preventDefault();
      if (action === "next") step(1);
      else if (action === "prev") step(-1);
      else if (action === "first") goTo(0);
      else if (action === "last") goTo(total - 1);
      else if (action === "black") toggleScreen("black");
      else if (action === "freeze") toggleScreen("frozen");
      else if (view === "presenter" && action === "theme") setTheme((t) => { const n = t === "dark" ? "light" : "dark"; persist("aideck.present.notesTheme", n); return n; });
      else if (view === "presenter") setZoomStep((z) => { const n = Math.max(0, Math.min(ZOOM_STEPS.length - 1, ZOOM_STEPS.indexOf(z) + (action === "zoom-in" ? 1 : -1))); persist("aideck.present.notesZoom", String(ZOOM_STEPS[n])); return ZOOM_STEPS[n]; });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const switchView = (next: PresenterViewKind) => {
    if (next === view) return;
    if (view === "editor") {
      if (editorDirty.current && !window.confirm("Discard unsaved slide edits?")) return;
      editorDirty.current = false;
      goTo(readActiveSlideIndex(source));
    }
    setView(next);
  };

  const audienceIndex = frozenAt ?? index;
  const nextTarget = nextPresentableIndex(pacings, index, 1);
  const elapsed = elapsedMs(clock, now);
  const targets = useMemo(() => parsed.map((notes) => notes.targetSeconds), [parsed]);
  const rows = rehearsalRows(
    recordVisit(log, visit.current.slideId, now - visit.current.at),
    slides.map((slide, i) => ({ id: slide.id ?? String(i), title: slide.tocTitle ?? slide.id ?? slide.type, targetSeconds: parsed[i].targetSeconds })),
  );

  return <div className="present-root">
    <ViewSwitcher editorDisabledReason={kind === "export" ? EXPORT_EDITOR_HINT : undefined} onChange={switchView} view={view} />
    {view === "presenter" && <PresenterView
      audienceIndex={audienceIndex} clock={clock} index={index} kind={kind} nextIndex={nextTarget !== index ? nextTarget : null}
      notes={parsed[index]} notesTheme={theme} notesZoom={zoomStep} now={now}
      onAdjustClock={(delta) => setClock((c) => adjustClock(c, delta, Date.now()))} onJump={goTo} onNext={() => step(1)} onPrev={() => step(-1)}
      onResetClock={() => setClock(INITIAL_CLOCK)} onToggleBlack={() => toggleScreen("black")} onToggleClock={toggleClock} onToggleFreeze={() => toggleScreen("frozen")}
      pace={paceAgainstTargets(targets, index, elapsed)} rehearsalRows={rows} screen={screen} source={source} />}
    {view === "slide" && <div className="present-slide-view"><MirrorFrame exportUrl={runtimeDeckExportUrl} index={audienceIndex} kind={kind} source={source} /></div>}
    {view === "editor" && renderEditor((dirty) => { editorDirty.current = dirty; })}
  </div>;
}
