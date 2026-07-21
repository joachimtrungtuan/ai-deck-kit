---
module: "core-orchestration"
surface: ["cli", "skill"]
status: "draft"
version: "0.1.0"
depends_on: []
---

# Module PRD: Core Orchestration

## 1. Purpose
Orchestrates the AI Deck Kit workspace by resolving the engine/decks split, managing installation/upgrades, and exposing core CLI commands that all other modules depend on. Entry point for all user interactions.

## 2. Responsibilities
- **In scope:** workspace resolution (walk up to `ai-deck-kit.json`), CLI commands (init, upgrade, doctor, config, list), deck registry, root pointer management, version pinning, compatibility checks.
- **Out of scope:** content authoring, template design, generation logic (delegated to respective modules).

## 3. Surfaces
- **CLI:** `aideck init [--here|--dir <subfolder>]` (scaffold workspace), `aideck upgrade [--to <version>]` (pull new engine), `aideck doctor` (report mismatches), `aideck config` (read/write ai-deck-kit.json), `aideck list` (enumerate decks).
- **Skill:** workflow routing (which skill/command to invoke for user intent).
- **Runtime:** —

## 4. Inputs & Outputs
- **Inputs:** `ai-deck-kit.json` (root pointer), CWD (for workspace discovery), `.git/` (for repo root detection).
- **Outputs:** `ai-deck-kit.json` (created/updated), `engine.version.json` (pinned version), deck registry in manifest.

## 5. Files & Data Touched
- **Reads:** `.git/`, `ai-deck-kit.json`, `package.json`, engine + deck manifests.
- **Writes:** `ai-deck-kit.json` (root pointer), `engine/engine.version.json` (version pin); never writes to `decks/` on upgrade.

## 6. Dependencies
- `system-architecture.md` (two-root model, workspace resolution, distribution §2–3).
- External: Node.js, npm/yarn.

## 7. Success Criteria
- [ ] Walk up from CWD finds `ai-deck-kit.json` at project root.
- [ ] Init creates workspace + root pointer; engine/decks paths resolved correctly.
- [ ] Upgrade pulls new engine; `decks/` untouched; version pinned in both files.
- [ ] Doctor reports schema/catalog/template version mismatches without silent migration.
- [ ] List enumerates all decks with slug + status.

## 8. Risks & Mitigations
- **Root pointer missing:** doctor detects, suggests re-init. Mitigation: init writes pointer atomically.
- **Version conflict:** engine declares which schema/catalog ranges it supports. Doctor validates before ops. Mitigation: never force-migrate decks.

## 9. Open Questions
- None blocking.
