# Export picker hardening — 2026-11-15

## What changed

- Made `ScreenDeck` use its clamped active index for loading, transitions, labels, and committed picker ARIA state.
- Added a no-slide guard for an in-place source shrink and clamped pending picker focus when the source count changes.

## Why

Close the residual stale-index and inconsistent active-state paths identified in the export picker review while preserving the strict CSP-safe button/listbox design.

## Verification

- Current shipped Swiss Modern export: Chrome picker proof passed all targeted keyboard, focus, outside-pointer, iframe, and deck-key isolation cases.
- `npm test`: 228 passed, 0 failed.
- `npm run build:check`, `npm run lint`, `npm run typecheck`, `npm run validate`: passed.

## Follow-up

The CLI file-URL CSP probe still reports its known local-file runtime failure; loopback execution of the same generated artifact passed the interaction proof.
