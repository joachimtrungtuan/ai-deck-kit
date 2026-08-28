---
module: "template-management"
surface: ["cli", "skill"]
status: "shipped"
version: "0.1.0"
depends_on: ["design-primitives"]
---

# Module PRD: Template Management

## 1. Purpose
Authors and versions template sets (`.template` bundles), and keeps decks in a known relationship to the template they were built from. Templates compose primitives (blocks, motion, tokens) and declare slide-type layouts. One template per deck; templates live in exactly one place — the project's `templates/`.

## 2. Responsibilities
- **In scope:** `aideck template new/validate/list/version`, `aideck deck status/retemplate`, .template bundle structure (`template-manifest.json`, design-system.css, layouts/, animation-presets.css, icon-policy.md), token customization, four version axes (`templateVersion`, `slideTypeCatalog`, `blockCatalog`, `contentSchemaVersion`).
- **Out of scope:** primitive block definitions (owned by design-primitives), deck content authoring (owned by presentation).

## 3. Surfaces
- **CLI:** `aideck template new <name>` (scaffold .template in project `templates/`), `aideck template validate <name>` (check the bundle in place), `aideck template list` (every resolvable template with origin + `overrides shipped`), `aideck template version <name> [--bump <part>]` (read or bump semver; refuses shipped defaults), `aideck deck status [<slug>]` (drift), `aideck deck retemplate <slug> [--to <name>]` (re-sync one deck).
- **Skill:** design token values, layout overrides, animation customization (within preset vocabulary), and **choosing the version bump after every template edit** — the CLI never edits template content or infers a bump, so an unbumped edit is invisible drift.
- **Runtime:** —

## 4. Inputs & Outputs
- **Inputs:** `template-manifest.json`, design-system CSS, layout specifications.
- **Outputs:** validated .template bundle in project `templates/`, embedded template snapshot in .deck (portability), version records, drift reports.

## 5. Files & Data Touched
- **Reads:** `templates/{set}.template/template-manifest.json` then `engine/templates/{set}.template/template-manifest.json` (project wins), `deck.json` (`template.set` + `version` + `origin`).
- **Writes:** `templates/{set}.template/` (user-owned), embedded `{slug}.deck/template/` (snapshot, replaced only by `deck retemplate`), `deck.json` template binding.

## 6. Dependencies
- `design-primitives` (block/motion catalog versions).
- `deck-format-spec.md` (.template bundle § 9, embedding § 8, portability § 8).
- `system-architecture.md` (versioning axes § 6, templates § 4).

## 7. Success Criteria
- [x] `aideck template new` scaffolds .template with required files (`template-manifest.json`, design-system.css, layouts/, icon-policy.md).
- [x] Template manifest declares required block/motion/slide-type-catalog versions.
- [x] `aideck new` embeds template snapshot into .deck for portability.
- [x] Versioning supports four semantic axes independently (`templateVersion` != `blockCatalog` version, etc.).
- [x] Doctor detects missing/mismatched template sets and reports required version.
- [x] A project template of the same name always wins over a shipped default, in every resolution path.
- [x] Resolution failure is an error naming both locations — never a silent fallback to another template.
- [x] `deck.json` records `template.origin`, so "moved forward" and "different template, same name" are distinguishable.
- [x] `deck retemplate` re-syncs one deck, refuses an incompatible target, restores on failure, and never rewrites `content.md`.
- [x] `remove template --reassign` re-templates affected decks before deleting; without it, the delete is refused.

## 8. Risks & Mitigations
- **Template not portable:** embed snapshot at deck-creation time. Mitigation: aideck new always embeds resolved template.
- **Version skew:** `template-manifest.json` declares supported catalog ranges. Mitigation: doctor validates before render.
- **Unbumped template edit hides drift:** the CLI cannot detect a change without a version move. Mitigation: versioning discipline is a mandatory step in `presentation-template-creation` (patch/minor/major sized by scale), and `deck status` surfaces what it can see.
- **Re-sync silently breaking a deck:** a template change can reposition content. Mitigation: one deck at a time, agent-run, `content.md` untouched, major-version gaps flagged as requiring visual review.

## 9. Open Questions
- None blocking.
