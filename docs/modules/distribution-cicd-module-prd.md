---
module: "distribution-cicd"
surface: ["cli"]
status: "draft"
version: "0.1.0"
depends_on: []
---

# Module PRD: Distribution & CI/CD

## 1. Purpose
Installs AI Deck Kit into projects, manages versioning, upgrades engine, and runs CI/CD pipeline (lint, typecheck, validators, smoke tests). Installer is the entry point; CI runs in the engine repo; upgrade is in-place only.

## 2. Responsibilities
- **In scope:** `npx github:<owner>/ai-deck-kit init` (install, scaffold workspace, write root pointer), `aideck upgrade [--to <version>]` (update engine only), GitHub Actions CI (lint/typecheck/validators/smoke export), release process (semver tags, publish), single-package repo layout.
- **Out of scope:** user deck management (owned by presentation module), template authoring (owned by template-management).

## 3. Surfaces
- **CLI:** `aideck upgrade [--to <version>]` (pull new engine version into `engine/`, update `ai-deck-kit.json` + `engine.version.json`, leave `decks/` untouched). Installer via `npx` (entry point, runs once per project).
- **Skill:** —
- **Runtime:** —

## 4. Inputs & Outputs
- **Inputs:** GitHub repo (engine source), `ai-deck-kit.json` (current version), `package.json` (semver).
- **Outputs:** installed `ai-deck-kit.json`, `engine/` folder (version-pinned), `engine.version.json` (version record), npm package published on tag.

## 5. Files & Data Touched
- **Reads:** `package.json`, `ai-deck-kit.json` (current version), GitHub repo tags/releases.
- **Writes:** `ai-deck-kit.json` (root pointer, version), `engine/engine.version.json` (pinned version), `engine/` tree (on upgrade).

## 6. Dependencies
- `core-orchestration` (workspace resolution, version compatibility checks).
- `system-architecture.md` (two-root model § 2, distribution § 9, install/upgrade flow § 3).
- External: Node.js, npm/yarn, GitHub API, GitHub Actions.

## 7. Success Criteria
- [ ] `npx github:<owner>/ai-deck-kit init` scaffolds workspace at project root (default) or subfolder (--dir).
- [ ] Init writes ai-deck-kit.json + engine.version.json atomically; workspace ready after one command.
- [ ] `aideck upgrade` pulls new engine; verifies compatibility; leaves decks/ untouched.
- [ ] CI runs: lint, typecheck, validators, build runtime, export smoke test.
- [ ] Semver tags trigger publish to npm (or npx-from-GitHub); release notes auto-generated.
- [ ] Upgrade is idempotent; multiple runs safe.

## 8. Risks & Mitigations
- **Partial install failure:** rollback plan or atomic writes. Mitigation: init writes all files in transaction; error messages guide recovery.
- **Upgrade breaks decks:** version compatibility check in doctor. Mitigation: upgrade refuses to proceed if mismatched; user must use supported engine version.
- **GitHub Actions timeout:** export smoke test may be slow. Mitigation: configurable timeout, optional on PR.

## 9. Open Questions
- None — locked: npx-from-GitHub, single package, no npm registry.
