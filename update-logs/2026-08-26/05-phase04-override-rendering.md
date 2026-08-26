# Phase 4 — Engine-side CSS/HTML override rendering (content.md schema redesign)

## What changed

Plan: `plans/260826-1000-content-md-schema-redesign/plan.md`, phase 04
(revision 2 scope: engine-side only; the downstream concept-diagram edit was
removed and re-homed in phase-07 Next Steps).

1. `engine/preview-app/src/slide-override-layer.tsx` (new) — `SlideOverrideLayer`
   renders a slide's `override.css` as a `<style>` tag and `override.html` as an
   absolutely-positioned, `pointer-events: none` overlay div; returns null when
   neither is set.
2. `engine/preview-app/src/fixed-slide-canvas.tsx` — portaled wrapper div now
   carries `data-slide-id={slide.id}` unconditionally (separate from the existing
   Agentation-gated `id`), and renders `<SlideOverrideLayer>` after
   `<slide.Component>`.
3. `engine/preview-app/src/deck-export.tsx` — same two additions inside
   `PrintDeck`, so overrides survive PDF/print capture.
4. Step 1 (`SlideOverride` type + `override?` field) was already landed with
   phase-02 (`preview-types.ts`, wired via `content-schema-v2.tsx`).

## Why

Overrides were defined in the v2 schema and validated but never rendered. Both
render sites needed the change or overrides would show live yet vanish from PDF
export.

## Verification

- Scratch v2 fixture deck (hand-stamped 2.0.0, linear-dark): slide-01 with
  override css/html, slide-02 clean control.
- Live preview (?deck=): style applied visibly (kicker → rgb(255,45,85) @ 90px),
  overlay marker rendered with computed pointer-events:none; slide-02 untouched
  → data-slide-id scoping holds.
- Export path: standalone export HTML + ?print: slide-01 page carries override;
  stacked slide-02 page unaffected even though both share one document.
- Note: dev-server `?deck=&print` still renders PreviewApp (runtimeDeck baked at
  module load); print layout must be exercised on the exported single-file build.
- Gates: tsc --noEmit (main + storybook) clean; cli tests 57/57 pass
  (`npx tsx --test cli/tests/*.ts`).
- Downstream `AI Udemy Course/` untouched (success criterion 3).
- Scratch fixture deleted after verification.

## Follow-ups

- Phases 5–7 remain: template migration, v1 freeze verification, release cutover.
- Phase-01 docs follow-up steps (7–9) still unchecked.
