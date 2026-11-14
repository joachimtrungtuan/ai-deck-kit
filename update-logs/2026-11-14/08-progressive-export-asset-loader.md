# Progressive export asset loader

## What changed

- Added a delivery-agnostic asset loader with per-slide readiness, shared-path de-duplication, startup gating, ordered background loading, and jump reprioritisation.
- Added delayed slide gates for interactive export and a static loader/progress shell in the export HTML.
- Updated screen and print export paths so interactive navigation waits for the selected slide and print capture waits for every asset to settle.
- Moved the inlined export stylesheet with the app script during post-build assembly so the static loader can paint first.

## Why

Progressive exports must show feedback immediately, avoid requesting every image at once, keep jump navigation responsive, and prevent PDF capture from racing image decode.

## Verification

- `node --experimental-strip-types --test engine/cli/tests/export-asset-loader.test.ts` — 8 passing.
- `npm test` — passing.
- `npm run build:check` — passing.
- `npm run lint` — passing.
- `npm run typecheck` — passing.
- `npm run validate` — passing.

## Follow-ups

Throttled browser proof for loader visibility and early jump gating remains scheduled for the later headless/manual phases.

## Review fixes

- Failed fetch/decode now keeps slides and the full export unready, exposes failed paths to the gate, and writes an export error marker for PDF failure reporting.
- An early jump reserves a priority request so the target can begin before the first four startup assets finish.
- PDF capture now requires `data-export-ready="true"`, reports asset failures or readiness timeout, and uses a 30-second bounded wait for both DOM synchronization and screenshot capture.
- Regression coverage now includes early jumps and failed-asset readiness.
- The screenshot Chrome invocation now emits and verifies its own readiness/error DOM marker before its PNG is accepted; a prior process cannot mask a slower second load.
