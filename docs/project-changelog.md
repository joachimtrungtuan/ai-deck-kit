# AI Deck Kit — Project Changelog

## 2026-07-23

- Added root distribution entrypoint and root/subfolder installer flow.
- Added atomic engine-only upgrade with doctor verification and deck-tree hash smoke test.
- Added GitHub Actions CI/release workflows and deployment/upgrade documentation.
- Migrated shipped template helpers to shared primitive block compositions and base-token aliases.
- Added nested-workspace validation and HTML/PDF export coverage for Swiss Modern and Linear Dark.
- Verification note: local lint, typecheck, validators, source-fixture smoke, exports, and package dry-run passed; registry-backed clean install remains blocked by npm DNS `ENOTFOUND`, and no remote release is claimed.
