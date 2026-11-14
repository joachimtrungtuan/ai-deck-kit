# Asset reference edge cases

## What changed

- Allowed rendered asset keys whose file names contain spaces while retaining a file-like extension guard so prose such as `assets/ is where images live` is not collected.
- Added shared collection and replacement support for unquoted CSS `url(assets/<file>)` references.
- Added focused path/resolver coverage and real single/web export coverage for a spaced PNG plus unquoted CSS URL.

## Why

Progressive export previously rejected a valid spaced file name and ignored unquoted CSS URLs, causing missing table entries and unresolved render references.

## Verification

- Focused generated export regression passed with normal and print CSP checks in both modes, including linked file bytes and single-mode table payload.
- `npm run typecheck` passed.
- `npm run lint` passed.

## Follow-ups

Run the repository's full serial test and validation gates before merge.
