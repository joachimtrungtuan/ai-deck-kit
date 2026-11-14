# Asset reference gap fix

Status: DONE

## Root cause

`deck-asset-paths.ts` required whole-string asset paths to contain no whitespace, and only scanned quoted paths inside longer strings. A valid `assets/my image.png` value was therefore ignored, as was `url(assets/x.png)` in CSS. Collection and render-time replacement shared those helpers, so both delivery modes inherited the gap.

## Fix

- Whole-string paths now accept spaces when the basename is file-like (has an extension); ordinary prose beginning with `assets/` remains ignored.
- A shared unquoted CSS `url(...)` matcher is used by both collection and replacement.
- Tests cover direct extraction/replacement and real generated single/web output. The generated test verifies single-mode payload mapping, web-mode copied bytes and URL encoding, and automatic normal/print CSP checks.

## Evidence

- Focused generated export regression passed (11/11 tests; browser-backed case passed in 13.1s with normal and print checks).
- `npm run typecheck` passed.
- `npm run lint` passed.

## Unresolved questions

None.
