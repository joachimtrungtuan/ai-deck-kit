# Fix Safari style-src-attr violation

## What changed

- Replaced the native export `<select>` picker with a button/listbox picker.
- Added attribution and validation report at `plans/261114-0021-progressive-html-export/reports/debug-safari-csp.md`.

## Why

Safari reported one normal-mode `style-src-attr` violation targeting a plain native `<select>`. A minimal strict-CSP fixture reproduced it without React or authored inline styles. Print had no event because it does not render the picker.

## Validation

Focused CSP/frame tests 5/5, full test suite, build-check, lint, typecheck, and validate pass. Existing Safari print evidence remains zero-violation; fresh Marusei normal rerun requires the external source deck.
