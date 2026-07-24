# Phase 07-08 — Distribution, Template Migration, QA

## What changed

- Added root `ai-deck-kit` distribution package and `npx` entrypoint.
- Added root/subfolder init, atomic engine-only upgrade, doctor verification, and local source fixture support.
- Added CI/release workflows, package ignore rules, deployment guide, and project changelog.
- Migrated Swiss Modern and Linear Dark shared title/image/stat composition to the primitives layer and preserved template token aliases.
- Made validation/export resolve nested engine roots; added nested install and upgrade hash smoke coverage.

## Why

Complete the active AI Deck Kit Phase 07 distribution contract and Phase 08 template/QA contract without touching user deck content during upgrades.

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run validate` — pass for both shipped templates.
- `AIDECK_CI_SKIP_INSTALL=1 npm run test:smoke` — pass; nested engine, both templates, local upgrade, doctor, and deck hash preservation.
- VIVIMOON validator, standalone HTML export, and escalated Chrome/ImageMagick PDF export — pass.
- `npm pack --dry-run` — pass; generated dependencies excluded.
- Full clean-install smoke remains environment-blocked by npm registry DNS (`ENOTFOUND`), not by a repository assertion.

## Follow-ups

- Run the full CI smoke on GitHub Actions with registry access and Linux Chrome/ImageMagick before tagging a release.
