# Presenter UI feedback fixes

## What changed
- **Layout** (`presenter-view.css`, `presenter-view.tsx`): flex layout fills the viewport below the view switcher with no overflow. New `column-splitter.tsx` gives a draggable, arrow-key splitter (min 360px slides / 300px notes; split kept in localStorage). Frame boxes drop their fixed aspect ratio, so the canvas's existing min(width, height) fit contain-fits each slide.
- **Frames**: current slide plus static previous and next previews. `still` prop on `FixedSlideCanvas`/`MirrorFrame` injects `STILL_FRAME_CSS`, pinning entrance animations on their final state. New `slide-position-caption.tsx` shows slide number, title, screen-state badge and progress bar.
- **Bottom bar**: two rows (clock row, controls row). `talk-clock-bar.tsx` adds ±5/±10 min, wall clock with seconds, and labels pace as "Schedule: on pace / m:ss behind / m:ss ahead" with an explanatory tooltip (or "no targets set").
- **Go to**: new `go-to-slide-control.tsx` with a number box plus a title dropdown.
- **Notes zoom**: A−/A+ buttons beside the notes header. New `notes-zoom-memory.ts` keys the stored size to `runtimeServerRunId` (exported by `vite-deck-plugin.ts`), so it applies to all slides and resets when the `present` server restarts.
- **Live-deck transitions** (`mirror-frame.tsx`): live `MirrorFrame` only swapped the slide prop, so no view transition ran; export mode worked because the export calls `goToSlide`. `LiveFrame` now calls `goToSlide` with the frame document on index change. Shared with Slide view (also benefits); Editor untouched.

## Why
User annotations on `/?present` (9 items) + report that transitions don't play in present mode with a live deck.

## Verification
typecheck, lint, `npm test` (164 pass). Browser at 1728×922: scrollHeight = viewport, frames 16:9 inside boxes, side frames have 0 running animations, current runs its entrance, zoom survives reload, title dropdown jumps.

## Follow-ups
- The temporary Agentation annotation tool used for feedback was removed before committing.
- PRD `docs/modules/presenter-module-prd.md` requirements 3, 4, 7, 8, 10, 11 updated; 18 (Layout) added.
