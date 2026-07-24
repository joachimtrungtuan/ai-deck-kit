# Phase 07/08 Distribution and Template QA Completed

**Date**: 2026-07-23 17:13
**Severity**: Medium
**Component**: AI Deck Kit distribution, template primitives, CI/smoke QA
**Status**: Resolved with environment-limited follow-up

## What Happened

Phase 07/08 was completed. The repository now has the distribution package and `npx` entrypoint, root and subfolder initialization, atomic engine-only upgrades, doctor checks, CI/release workflows, and local source-fixture support. Swiss Modern and Linear Dark shared title/image/stat composition moved onto the primitives layer while template token aliases remained compatible.

## The Brutal Truth

The implementation is in good shape, but the final clean-install proof could not be completed locally. That is frustrating because the remaining uncertainty is not application behavior; it is whether npm can reach its registry from this environment. We spent verification effort proving the repository is not the failure point, only to hit infrastructure DNS.

## Technical Details

`npm run lint`, `npm run typecheck`, `npm run validate`, and `AIDECK_CI_SKIP_INSTALL=1 npm run test:smoke` passed. Smoke coverage included nested engine resolution, both shipped templates, local upgrade hashing, doctor verification, and deck-content preservation. VIVIMOON validation, standalone HTML export, escalated Chrome/ImageMagick PDF export, and `npm pack --dry-run` also passed.

The full clean-install smoke remains blocked by npm registry DNS resolution: `ENOTFOUND`. Generated dependencies were confirmed excluded from the package dry run.

## Decisions and Lessons

Upgrades remain engine-only so user deck content is not modified. Validation and export resolve nested engine roots, and template migration preserves existing token aliases. The failed clean install must not be “fixed” by weakening tests or adding package shortcuts; it requires a registry-accessible environment.

## Next Steps

Run the full CI smoke on GitHub Actions with registry access and Linux Chrome/ImageMagick, then decide whether the release is ready for tagging.
