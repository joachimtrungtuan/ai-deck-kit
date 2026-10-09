# tocTitle slide-list label + tableColumnWidths for table slides

## What changed

**`tocTitle` (navigation-only slide field)**
- `content-schema-v2.tsx`: new `navigationSlideYamlKeys = ["tocTitle"]`, included in `recognizedSlideYamlKeys`; parsed onto the slide record (`PreviewSlide.tocTitle`), never passed to layouts.
- `slide-list-sidebar.tsx`: entry shows `tocTitle` with the slide type as small secondary text; falls back to the type alone. Styles in `preview-shell.css`.
- `deck-export.tsx`: export picker option reads `NN — tocTitle · type`, or `NN — type`.
- Validator: `tocTitle` must be a non-empty string when present.

**`tableColumnWidths`**
- `layoutPropReaders` passes `tableColumnWidths` through to layouts.
- Validator (v2/v3 block): non-empty list; requires `tableColumns`; count must match; all positive numbers (fractions) or all `"N%"` strings summing to 100 (±0.5); no mixing.
- New primitive `engine/primitives/blocks/table-column-widths.ts` → `tableColumnWidthPercentages(widths, visibleCount)`: fractions normalized over visible columns, percentages passed through, invalid → `undefined` (template keeps auto widths).
- Both shipped templates (`swiss-modern`, `linear-dark`) render a `<colgroup>` with fixed table layout when widths are valid.

**Versions**
- `contentSchemaVersion` 3.0.0 → 3.1.0 (additive minor): engine.version.json, both template manifests, CLI scaffold default (dist rebuilt).
- `templateVersion` 3.3.0 → 3.4.0 for both shipped templates.
- Showcase example deck left at 3.0.0 / pinned snapshot 3.2.0 — still valid under the same major.
- Engine version 1.1.1 → 1.2.0 (new feature): engine.version.json, both package.json files, package-lock, ai-deck-kit.json, verify-slide-type-catalog test pointer.

**Docs**: `docs/deck-format-spec.md` (fields + 3.1.0 history entry), `docs/codebase-summary.md`, `slide-types-v2.md`, `canonical-slide-content-schema.md`, `template-system-and-versioning.md`, `content-schema-guidance.md` (stability contract now says 2.x and 3.x share the v2 path).

**Tests**: new `engine/cli/tests/table-column-widths-and-toc-title.test.ts`; `content-schema-v2-runtime.test.ts` extended (pass-through, tocTitle not in props); `serve.test.ts` pinned regex updated for the recognized-keys contract change.

## Why

User request: show a human label per slide in the sidebar/export picker without reusing visible slide content (hence a dedicated `tocTitle` field rather than `title`/`kicker`), and let decks set table column widths. No earlier schema-side width change existed in the repo — both halves were implemented here.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test` (123/123), `npm run validate` — all pass.
- Live preview on a scratch copy of the showcase deck: sidebar shows `tocTitle` + type, type-only fallback; fractions `[1, 5, 1, 1.5, 1]` and percentages `["25%","45%","15%","15%"]` render exact column widths in both linear-dark and swiss-modern. Scratch deck removed.

## Follow-ups

- Consumer projects: `aideck upgrade`, then `aideck deck retemplate <slug>` for shipped templates; custom templates read `props.tableColumnWidths` (optionally via `tableColumnWidthPercentages`) and bump their own `templateVersion`.
- Observed (pre-existing, not changed): Vite HMR logs repeated `createRoot()` warnings when a deck's template snapshot is rewritten under a running dev server.
