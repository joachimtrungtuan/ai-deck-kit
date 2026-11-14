# Phase 06 gate diagnosis (2026-11-14)

## Outcome

Phase 06 gates are green after one real CSP defect fix. No sandbox workaround or test weakening used.

## Cause and fix

The generated policy serialized hash sources as `sha256-...` without the required CSP quotes. Chrome ignored those sources, blocking the inline frame-buster/recorder and application script. Unit tests checked hash membership but not the quoted CSP grammar.

Changed:

- `engine/skills/presentation-crafting/scripts/export-html-csp-meta.mjs`: quote only `sha256-*` sources while preserving keywords and origins.
- `engine/cli/tests/export-html-csp-meta.test.ts`: assert exact quoted hash directives.
- `update-logs/2026-11-14/10-progressive-export-csp-and-frame-busting.md`: record final evidence.

## Gate commands

| Command | Result |
|---|---|
| `node --experimental-strip-types --test engine/cli/tests/export-html-csp-meta.test.ts` | 2/2 pass |
| `npm test` (sandbox) | 203/205; Chrome PDF failed and Vite fixture hit `listen EPERM` — environment restrictions |
| `node --experimental-strip-types --test engine/cli/tests/export-asset-loader.test.ts` (escalated) | 11/11 pass |
| `npm test` (escalated) | 205/205 pass |
| `npm run build:check` | pass |
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm run validate` | pass |

## Strict-CSP browser evidence

Fixture: shipped `swiss-modern` template via `decks/presenter-test.deck`; Chrome 157 headless, `--virtual-time-budget=15000`, real generated output.

- Single export: `file:///tmp/aideck-phase06-browser/single/index.html` → Chrome exit 0; `data-csp-check="ran"`, `data-export-ready="true"`, no `data-csp-violations`.
- Web export: `file:///tmp/aideck-phase06-browser/web/index.html` → same result; same-origin asset policy exercised.
- Presenter: `node engine/cli/resolver.mjs present presenter-test --export --no-open --port 47812`; Playwright inspected both `.mirror-frame-export` iframe documents: each had `cspCheck=ran`, `exportReady=true`, no violations/errors; browser console errors = 0.
- PDF: `node engine/cli/resolver.mjs export pdf presenter-test` succeeded; `file://.../index.html?print` → `data-csp-check="ran"`, `data-export-ready="true"`, no violations; output PDF has 7 pages.

## Unresolved questions

- Marusei Google Fonts handling remains Phase 07 scope; not stripped or widened here.
- Firefox and Safari strict-CSP browser evidence remains covered by prior spike limitations, not this gate.

## Cross-origin regression follow-up

The original cross-origin test used `execFileSync` while its HTTP fixtures lived in the same Node process. That blocked the event loop, so Chrome could not receive the fixture response; the earlier timeout was incorrectly attributed to the environment. The test now uses asynchronous `execFile` and fails Chrome errors/timeouts (skipping only missing Chrome or explicit localhost `EPERM`).

With the corrected harness and escalated execution, Chrome returns in ~1s and the fixtures serve. The DOM remains the parent (`parent-marker`) rather than navigating to the child (`child-marker`), matching FR-61's best-effort fallback and Chromium's documented user-activation intervention. The regression now asserts no runtime failure or blank parent page; no guaranteed-navigation behavior is assumed.
