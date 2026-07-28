# Fix installed template bundle contract

## What changed

- Renamed shipped presets to `engine/templates/swiss-modern.template/` and `engine/templates/linear-dark.template/`.
- Updated CLI registration, lookup, listing, doctor checks, deck validation, preview/export imports, tests, skills, and docs to retain the `.template` suffix.
- Kept `template-manifest.json` as the canonical manifest filename and removed stale `template.json` wording.
- Anchored the root user-template exclusion in `.npmignore` so engine-owned bundles ship.
- Extended `npm run validate` to fail if either shipped bundle is absent from the release package.

## Why

The implementation stripped `.template` during registration even though the locked bundle specification required installed templates to retain it. The original npm ignore rule also excluded the renamed engine bundles from release packages.

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm run validate`
- `npm run test:serve` — 13/13 pass
- `AIDECK_CI_SKIP_INSTALL=1 npm run test:smoke`
- `npm exec -- vite build`
- `npm run build-storybook`
- Manual temporary lifecycle: `template new → register → list → version`

## Follow-ups

None.
