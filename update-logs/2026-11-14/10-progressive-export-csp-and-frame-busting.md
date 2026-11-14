# Progressive export CSP and frame-busting

## What changed

- Added the export security postprocessor for strict per-mode CSP, inline script/style SHA-256 hashes, referrer metadata, a CSP violation recorder, and cross-origin-only frame-busting.
- Replaced dynamic still-frame `<style>` injection in fixed canvases and presenter mirrors with the shipped `html[data-still]` selector.
- Added focused CSP tests covering metadata ordering, exact hashes, override CSS payloads, forbidden directives, and web-mode image policy.
- Export now prints the required one-line server-header note; it writes no server configuration files.

## Why

Exported decks need a strict browser policy without unsafe-inline/eval while presenter same-origin mirrors must continue to work.

## Validation

- Fixed CSP hash-source serialization: SHA-256 sources are quoted per CSP syntax; focused policy assertions updated.
- `npm test` — 205/205 pass (escalated run; sandbox-only Chrome/Vite failures were `Chrome failed` and `listen EPERM`).
- `npm run build:check`, `npm run lint`, `npm run typecheck`, `npm run validate` — pass.
- Shipped `presenter-test` strict browser checks: single and web exports report `data-csp-check="ran"`, `data-export-ready="true"`, no violation marker; presenter export has the same result in both mirror iframes; `?print` reports the same and generated PDF has 7 pages.
- Marusei Google font handling remains Phase 07 scope.

## Review fixes

- Replaced cross-origin `Location.replace` method access with permitted top-level `location` assignment and a fail-safe `data-csp-frame-bust="blocked"` marker when navigation is blocked.
- Added a real Chrome cross-origin iframe regression serving parent/child origins and asserting top-window navigation; it skips here because localhost binding is denied by the sandbox.
