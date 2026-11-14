# Phase 07 completion report

## Scope completed

- Extended external-source scanning to quoted HTML and JSON `src`/`href` properties.
- Protocol-relative and non-HTTP values now fail as unclassifiable; relative, `data:`, and fragment references remain ignored.
- Added focused regressions for HTML and JSON source forms.
- Added a real Vite export integration fixture. It copies the shipped deck/template into a temporary consumer, links the engine dependency and primitives roots, runs `export-standalone-html.mjs`, and inspects the final `index.html`.

## Evidence

Focused command (network/loopback escalation):

```text
node --experimental-strip-types --test engine/cli/tests/export-google-fonts-embed.test.ts
6 passed, 0 failed, 0 skipped
production Vite export embeds Google fonts in final index.html: passed
```

The integration assertion verified final HTML had no `fonts.googleapis.com` or
`fonts.gstatic.com`, contained `data:font/woff2;base64,`, and contained CSP
`font-src ... data:`. The temporary fixture was removed after the test; no original
Marusei source was changed.

Full gates (all passed):

- `npm test` — 219 passed, 0 failed.
- `npm run build:check` — committed CLI build current.
- `npm run lint` — 20 JavaScript files checked.
- `npm run typecheck` — passed.
- `npm run validate` — shipped templates, example deck, and package checks passed.

## Proof limits

- The Marusei source remains read-only and was not edited. Its prior scratch export
  was blocked by consumer dependency resolution; the new complete temporary fixture
  demonstrates the same production path independently.
- Browser visual/offline rendering of Marusei was not claimed. Final Vite HTML and CSP
  assertions are covered by the integration test.
