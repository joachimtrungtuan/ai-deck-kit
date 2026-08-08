# AI Deck Kit — Project Changelog

## 2026-08-08

- Removed the `clarity-courseware` template (bundle, catalog doc, registry entries) from this repo; it now lives as a project template in the target project it serves.

## 2026-07-25

- Added the shipped `clarity-courseware` template: a compact 10-type courseware profile with 25 curated layout variants and white, orange, and black background modes.
- Added original course imagery, Inter/Newsreader mixed-heading support, course headers, section/page footers, and restrained motion.
- Generalized manifest-backed `.deck` preview resolution so embedded bundles are
  preferred, installed `<name>.template` bundles are the fallback, and each
  bundle supplies its own layout components and deck class without template-name
  branches; embedded name/version identity is validated.
- Added layout/background variant validation to template and deck contracts, focused CLI tests, and fixed-canvas/export support for the new template.
- Fixed portable-install standalone exports so direct slugs honor the workspace `decksRoot` and HTML/PDF output stays beside the selected `.deck` bundle.

## 2026-07-23

- Added root distribution entrypoint and root/subfolder installer flow.
- Added atomic engine-only upgrade with doctor verification and deck-tree hash smoke test.
- Added GitHub Actions CI/release workflows and deployment/upgrade documentation.
- Migrated shipped template helpers to shared primitive block compositions and base-token aliases.
- Added nested-workspace validation and HTML/PDF export coverage for Swiss Modern and Linear Dark.
- Verification note: local lint, typecheck, validators, source-fixture smoke, exports, and package dry-run passed; registry-backed clean install remains blocked by npm DNS `ENOTFOUND`, and no remote release is claimed.
