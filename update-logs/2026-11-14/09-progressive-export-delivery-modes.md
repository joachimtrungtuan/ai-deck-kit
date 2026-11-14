# Progressive export delivery modes

## What changed

- Added single-mode per-slide `text/plain` JSON data blocks with first-use asset placement and safe `</` / `<!--` escaping.
- Added an observer-backed single-mode source that scans pre-existing blocks, consumes trickled blocks, and resolves loader payloads without fetch/XHR.
- Added web-mode image preload source and mode-aware runtime wiring while preserving the existing serve inline-table path.
- Added temporary Vite-emitted asset metadata and post-build block assembly; metadata is removed after success and on build failure.

## Verification

- Real single/web fixture exports pass, including shared-asset de-duplication and URL-encoded web paths.
- Real Chrome/ImageMagick PDF readiness regressions remain passing.
- Focused block, loader, export, and dedup tests pass.
- `npm run typecheck`, `npm run build:check`, `npm run lint`, and `npm run validate` pass.

## Follow-ups

Progressive first-paint manual verification through the Marusei trickle server and Safari remains scheduled for the final manual phase. CSP hashing/metadata is intentionally deferred to phase 06.

## Review fixes

- The data-block observer now waits for a following sibling before parsing, rescans all blocks on mutations, and flushes the final block at `DOMContentLoaded`; malformed blocks are not permanently discarded after an early parse attempt.
- Payload waiters now retain reject callbacks and fail clearly on malformed blocks or missing paths after the document stream closes, preventing indefinite slide gates and PDF waits.
- Post-Vite assembly and intermediate-file cleanup now run under `try/finally`, including failures while moving scripts, appending blocks, or writing the final HTML.
- Added deterministic coverage for incomplete-block deferral and final-block flushing.
