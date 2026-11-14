# Fix Safari style-src-attr violation

## What changed

- Replaced the export slide gate's dynamic React inline width style with a CSSOM custom-property update.
- Added the custom-property width rule to the hashed export shell CSS.
- Added attribution and validation report at `plans/261114-0021-progressive-html-export/reports/debug-safari-csp.md`.

## Why

Safari reported one normal-mode `style-src-attr` violation in both export modes. The event correlated with the only normal-only dynamic inline style: the slide gate progress width. Print had no event because the gate is absent.

## Validation

Focused CSP/frame tests 5/5, full test suite, build-check, lint, typecheck, and validate pass. Existing Safari print evidence remains zero-violation; fresh Marusei normal rerun requires the external source deck.
