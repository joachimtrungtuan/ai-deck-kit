# Mount Agentation inside the slide iframe

## What changed

`aideck serve` previews render slide content inside a fixed 1600×900 `<iframe>`
(`FixedSlideCanvas`) so `vw`/`vh` CSS resolves against a pinned canvas instead
of the real window. Agentation was mounted in the parent document as a sibling
of `AppRouter`, but it has no iframe-targeting capability (same-origin
isolation; vendor-confirmed, no prop for it) — so the entire slide canvas read
as one opaque, unselectable element. Clicking inside a slide could never pick
an individual heading, image, or block.

Fix: mount Agentation *inside* the slide iframe instead of the shell.

- `engine/preview-app/src/iframe-agentation-entry.tsx` (new) — a standalone
  React root that renders `<Agentation />`. Loaded as a `<script type="module">`
  injected directly into the iframe's own document, so its `document`/`window`
  bindings — and therefore its click-picker — resolve to the iframe, where the
  actual slide elements live.
- `engine/preview-app/src/fixed-slide-canvas.tsx` — added a `mountAgentation?:
  boolean` prop; `initFrame()` injects the entry script (idempotently, guarded
  against React StrictMode's double effect invocation) only when set.
- `engine/preview-app/src/main.tsx` — removed the top-level `<Agentation />`
  mount and the `agentation` import entirely; `PreviewApp` now passes
  `mountAgentation` to its `FixedSlideCanvas` call. The shell (sidebar, slide
  nav, gallery grid) has no annotation capability by design — only rendered
  slide content does.
- `deck-export.tsx`'s `ScreenDeck` reuses the same `FixedSlideCanvas` without
  `mountAgentation`, so the export/PDF pipeline is unaffected (verified: no
  `agentation` reference in `export-main.tsx`).
- `TemplateGallery` never rendered slide content through `FixedSlideCanvas` to
  begin with (its cards are static index/label tiles) — out of scope, no
  change needed.

## Why

User-reported bug: "the whole preview panel for the slide is considered to be
one big element. We can't select anything inside of it." Root cause confirmed
via Agentation's own docs (agentation.com/faq): "Agentation only annotates
elements in the main document. Iframes and shadow DOM content are not
accessible due to browser security restrictions." User explicitly directed
in-iframe mounting and dropping the outer instance — no annotation need for
the engine/shell interface itself.

## Verification

- `npm --prefix engine run typecheck` — clean.
- `npm run lint` — clean (11 JS files).
- `npm run test:serve` (26 tests), `test:lifecycle` (6), `test:boundary` (12)
  — all pass. Rewrote the stale
  `engine/cli/tests/serve.test.ts` assertion that expected the old top-level
  `<Agentation />` mount.
- Live browser check against the `vivimoon-website` deck: activated feedback
  mode, clicked the slide headline — Agentation drew a tight selection box
  around just that element (breadcrumb `<FixedSlideCanvas> <LinearTitleSlide>`),
  not the whole panel. Confirmed via DOM inspection that the toolbar
  (`[data-agentation-toolbar]`) lives inside the iframe's document and the
  parent/shell document has zero Agentation elements.

## Follow-ups

- `docs/modules/annotation-module-prd.md` updated to describe the new
  in-iframe injection mechanism and the template-gallery's out-of-scope status.
- Added `.claude/launch.json` (preview config for `aideck serve --deck
  vivimoon-website --port 5183`) to support the live verification — kept as a
  reusable local dev preview shortcut.
