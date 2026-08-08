# Remove and migrate the clarity-courseware template

**What changed**

- Migrated `clarity-courseware.template` (17 files, incl. its `assets/` folder) and its
  `clarity-courseware-slide-types-v1.md` catalog doc into the target project's root
  `templates/` (single-template-home pattern), copying from this repo's copy since the
  target's own engine-shipped copy was missing the `assets/` folder.
- In the target project: removed `clarity-courseware` from `engine.version.json`'s
  `shippedTemplates` (kept `clarity-courseware-v1` in `supportedSlideTypeCatalogs` — it's
  still an active project template there, not deregistered), removed its
  `engine/templates/` copy + catalog doc, removed its row from `template-system.md`, and
  swapped the `serve.test.ts` fixture off `clarity-courseware`.
- In this repo: deleted the `clarity-courseware.template` bundle from both
  `engine/templates/` and root `templates/`, deleted the catalog doc, and fully
  deregistered it from `engine/engine.version.json` (both `shippedTemplates` and
  `supportedSlideTypeCatalogs` — no deck here uses it), `engine/templates/template-system.md`,
  `scripts/validate.mjs`, `scripts/ci-smoke.mjs`, `engine/cli/tests/serve.test.ts`,
  `README.md`, `docs/codebase-summary.md`, `docs/system-architecture.md`. Added a new
  `docs/project-changelog.md` entry. Left historical `docs/journals/...`,
  the 2026-07-25/2026-08-03 update-logs, and past changelog entries untouched as
  dated historical record.

**Why**

User is moving the courseware template to the project it actually serves
(`AI Udemy Course/courses/claude-for-marketers/slides`) and wants this engine repo's
shipped defaults reduced to `swiss-modern` + `linear-dark`.

**Follow-ups**

- None outstanding; validated via `scripts/validate.mjs` and the CLI test suite (see same-day report if run).
