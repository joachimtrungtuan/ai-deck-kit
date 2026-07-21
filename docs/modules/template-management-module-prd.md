---
module: "template-management"
surface: ["cli", "skill"]
status: "draft"
version: "0.1.0"
depends_on: ["design-primitives"]
---

# Module PRD: Template Management

## 1. Purpose
Authors, registers, and versions template sets (`.template` bundles). Templates compose primitives (blocks, motion, tokens) and declare slide-type layouts. One template per deck; templates are code-owned and upgradable.

## 2. Responsibilities
- **In scope:** `aideck template new/register/list/version`, .template bundle structure (template.json, design-system.css, layouts/, animation-presets.css, icon-policy.md), token customization, three+one version axes (template_version, slide_type_catalog, block_catalog, content_schema_version).
- **Out of scope:** primitive block definitions (owned by design-primitives), deck content authoring (owned by presentation).

## 3. Surfaces
- **CLI:** `aideck template new <name>` (scaffold .template), `aideck template register <name>` (validate + mark as installed), `aideck template list` (show installed templates), `aideck template version <name>` (bump version, pin catalogs).
- **Skill:** design token values, layout overrides, animation customization (within preset vocabulary).
- **Runtime:** —

## 4. Inputs & Outputs
- **Inputs:** template.json manifest, design-system CSS, layout specifications.
- **Outputs:** installed .template bundle under `engine/templates/`, embedded template snapshot in .deck (portability), version records.

## 5. Files & Data Touched
- **Reads:** `engine/templates/{template-set}.template/template.json`, `deck.json` (template.set + version).
- **Writes:** `engine/templates/{template-set}.template/` (engine-side), embedded `{slug}.deck/template/` (snapshot, git-ignored or committed per user choice).

## 6. Dependencies
- `design-primitives` (block/motion catalog versions).
- `deck-format-spec.md` (.template bundle § 9, embedding § 8, portability § 8).
- `system-architecture.md` (versioning axes § 6, templates § 4).

## 7. Success Criteria
- [ ] `aideck template new` scaffolds .template with required files (template.json, design-system.css, layouts/, icon-policy.md).
- [ ] Template manifest declares required block/motion/slide-type-catalog versions.
- [ ] `aideck new` embeds template snapshot into .deck for portability.
- [ ] Versioning supports three semantic axes independently (template_version ≠ block_catalog version, etc.).
- [ ] Doctor detects missing/mismatched template sets and reports required version.

## 8. Risks & Mitigations
- **Template not portable:** embed snapshot at deck-creation time. Mitigation: aideck new always embeds resolved template.
- **Version skew:** template.json declares supported catalog ranges. Mitigation: doctor validates before render.

## 9. Open Questions
- None blocking.
