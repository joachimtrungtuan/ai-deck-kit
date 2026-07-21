---
module: "<module-slug>"          # kebab-case, matches folder
surface: ["cli", "skill", "runtime"]   # which surfaces this module owns (subset)
status: "draft"                  # draft | active | deprecated
version: "0.1.0"
depends_on: []                   # other module slugs
---

# Module PRD: <Module Name>

> Structured template for every AI Deck Kit module PRD. New modules copy this file
> so all module docs share one shape. Keep sections; delete guidance comments.

## 1. Purpose
One paragraph: what this module is responsible for and why it exists.

## 2. Responsibilities
- **In scope:** bullet list of what this module owns.
- **Out of scope:** what it explicitly does NOT do (and which module does).

## 3. Surfaces
- **CLI (deterministic):** commands this module exposes (`aideck ...`) + one-line each.
- **Skill (AI-driven):** skill behaviors/references, if any.
- **Runtime:** preview/export responsibilities, if any.

## 4. Inputs & Outputs
- Inputs: files/flags/data consumed.
- Outputs: files/artifacts produced (paths).

## 5. Files & Data Touched
- Reads: paths.
- Writes: paths. (Note engine/ vs decks/ boundary — never cross on upgrade.)

## 6. Dependencies
- Modules, specs (`deck-format-spec.md`, `system-architecture.md`), external tools.

## 7. Success Criteria
- [ ] Verifiable outcomes that define "done" for this module.

## 8. Risks & Mitigations
- Risk → mitigation.

## 9. Open Questions
- Unresolved items, or "None".
