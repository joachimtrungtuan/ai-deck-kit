---
module: "presenter"
surface: ["cli", "runtime", "schema"]
status: "implemented"
version: "0.1.0"
depends_on: ["preview", "presentation", "annotation", "export-package"]
---

# Module PRD: Presenter Mode

## 1. Purpose

Deliver a talk from the shared preview runtime: one **presenter window** (live mirror, notes, timers) drives one **audience window** (the slide, fullscreen on the external display). Replaces the ad-hoc presenter built for the Bodor project, which wrapped a frozen export in an iframe and drove it by poking its DOM.

## 2. Decisions (confirmed 2026-10-28)

| # | Decision |
| --- | ---------- |
| D1 | Presenter mode is a route inside `engine/preview-app/`. No new app. It never lives inside the exported HTML. |
| D2 | Two sources: **live deck** (default) or **frozen HTML export** (`--export`). Live mode lets you edit slides and notes while presenting. |
| D3 | `aideck export html` stays as is and never carries speaker notes. In both modes, notes are read from `content.md` only. |
| D4 | Entry points: `aideck present <deck> [--export]` and a **Present** button in `aideck serve`. Same server, same runtime. |
| D5 | The mirror is a **synced re-render** of the same slide and its entrance animation. It is not a screen capture. |
| D6 | The main window has three views, switchable at any time: **presenter**, **editor** (the normal serve authoring view), and **plain slide**. The audience window and the slide position survive every switch. |
| D7 | The `### Speaker Notes` schema gains `Pacing`, `Target` (duration) and `Cue` fields. The body is Markdown with safe HTML formatting. |

## 3. Requirements

1. **Two windows.** The presenter window owns the slide position, and the audience window follows it. Either window can be reloaded and comes back on the current slide.
2. **Screen placement.** On Chromium, the Window Management API (`getScreenDetails`) places the audience window fullscreen on the external screen, after a one-time permission and one click. Without permission or without an external screen, the audience window opens as a normal window beside the presenter window. A visible hint explains what happened.
3. **Live mirror.** The presenter view shows the current slide scaled down, plays its slide transition and entrance animation in step with the audience window, and shows its number, title and a progress bar prominently.
4. **Previous and next previews.** Two smaller, static frames (animations pinned to their final state) show the slides Previous and Next will go to, skipping ON-DEMAND slides.
5. **Notes.** Notes render Markdown plus an allow-listed set of HTML tags: headings, `ul`/`ol`/`li`, `strong`/`b`, `em`/`i`, `u`, `mark`, `br`, `p`, `span`, `code`, `blockquote`. Scripts, event handlers and embeds are stripped.
6. **Theme.** The notes area has light and dark themes. A toggle (key `T`) switches between them, and the choice is remembered per browser. The audience window is never themed.
7. **Font zoom.** The `+`/`−` keys and the A−/A+ buttons resize the notes text for every slide. The size lasts until the `present` server stops.
8. **Navigation.** The presenter window accepts →/↓/PageDown/Space for Next and ←/↑/PageUp for Previous. Next and Previous skip ON-DEMAND slides. A Go-to number box and a slide-title dropdown reach any slide. Presentation clickers work, because they send these keys.
9. **Blackout and freeze.** `B` blacks out the audience screen. `F` freezes it on the current slide while the presenter browses other slides. Pressing the same key again resumes.
10. **Clocks.** The presenter window always shows the current system time and the elapsed talk time. Elapsed time can be started, paused and reset, and adjusted by ±1, ±5 and ±10 min (to carry on after a restart). The system time shows seconds. It survives a reload.
11. **Pacing.** The presenter window shows each slide's pacing badge and target time, and a "Schedule" indicator: elapsed time compared with the summed target times of the slides before the current one, read as "on pace", "m:ss behind" or "m:ss ahead" (a tooltip explains it). Without targets it reads "no targets set".
12. **Cue.** The cue line is shown prominently near Next, as the hand-off to the next slide.
13. **Rehearsal log.** A rehearsal mode records the actual time spent on each slide and shows a table of actual vs target that you can copy. It never writes `content.md`.
14. **Drift check.** In export mode, if the slide list in `content.md` (count, ids, tocTitle, type) differs from the export, a banner names the first mismatches.
15. **Live updates.** In live mode, saving `content.md` refreshes both the slides and the notes without losing the current position.
16. **Safety banner.** The presenter window carries a "PRESENTER ONLY" marker that never appears in the audience window.
17. **No DOM-poking.** The audience window is driven through a navigation API that the runtime exposes. The export gets the same API, added without changing its visible behaviour.
18. **Layout.** The presenter view fills the window below the view switcher without scrolling. A draggable, keyboard-operable splitter sets the slides/notes column widths, with a minimum width on each side; the split is remembered per browser. Slide frames contain-fit their box. Clocks and controls sit in a two-row bottom bar.

## 4. Notes Schema (content.md)

```markdown
### Speaker Notes
Pacing: FOCUS            <!-- FOCUS | BRIEF | SKIM | ON-DEMAND; optional -->
Target: 2m30s            <!-- optional; forms: 90s, 2m, 2m30s -->
Cue: Hand over to the pricing table.   <!-- optional -->

Free Markdown body with <strong>safe</strong> HTML formatting.
```

- The header lines are optional and must sit at the top, in any order. Unknown values are reported by `validate-slide-content.mjs` as warnings. Notes without header lines stay valid, so the change is backward compatible.

## 5. Surfaces

- **CLI:** `aideck present <deck> [--export]`. This command validates the deck, runs `aideck export html` if `--export` is set and the export is missing or stale, then starts the preview server on the presenter route.
- **Runtime:** a presenter route and an audience route in the preview app, plus a **Present** button in the serve shell.
- **Skill:** `presentation-crafting` documents the notes schema and how to present.

## 6. Non-goals

- Speaker notes in, or next to, the client-facing HTML export.
- Screen-capture mirroring.
- Click-step builds or fragments inside a slide.
- Firefox and Safari placement (they fall back to a manual window, per requirement 2).
- Remote control from a phone, recording, or audience Q&A.
- Writing back to `content.md` from presenter mode.

## 7. Done means

- `aideck present <deck>` and `aideck present <deck> --export` both open the presenter window. Next and Previous move the audience window, proven by a recorded manual checklist on Chromium plus node:test coverage of the navigation and message logic.
- With an external screen and permission granted, the audience window lands fullscreen on that screen. Without them, it opens as a separate window. Both cases are checked manually on a real second display.
- Requirements 3–16 each have a passing node:test unit test (pure logic) or a recorded manual check (window and UI behaviour).
- `aideck export html` output is byte-for-byte free of speaker notes (checked by a test).
- Validators, the skill docs and this PRD reflect the new notes schema. The engine version and content schema are bumped.

## 8. Resolved Details (2026-10-28)
- **Freeze (R9):** the presenter mirror keeps showing the frozen audience slide. The slide being browsed appears in the next-slide frame, labelled "browsing". Unfreezing sends the audience to the browsed slide.
- **Editor view in export mode (D6):** disabled, with the tooltip "Editing needs live mode; restart without --export".
- **Elapsed timer (R10):** starts on the first Next or a manual Start, not when the window opens.
