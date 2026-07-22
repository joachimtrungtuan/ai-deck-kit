---
module: "design-primitives"
surface: ["cli", "skill", "runtime", "component-catalog"]
status: "draft"
version: "0.1.0"
depends_on: []
---

# Module PRD: Design Primitives

## 1. Purpose
Defines the shared building-block vocabulary (blocks, motion, tokens) that all templates and decks compose. Sits beneath template sets so every template reuses the same primitives instead of inventing them.

## 2. Responsibilities
- **In scope:** canonical block types (text, title+description, image, chart, table, icon-text card, quote, stat/KPI, list, code), motion vocabulary (gentle-rise, fade, none, morph), base token contract (color, type, spacing, radii, stroke, shadow).
- **Out of scope:** template-specific token values, layout implementation (owned by template-management).

## 3. Surfaces
- **CLI:** `aideck blocks list` (enumerate block types + schema), `aideck motion list` (list approved animations), `aideck tokens print` (display base token contract).
- **Skill:** choose/compose blocks for slides, tune motion per block/slide.
- **Runtime:** render blocks deterministically (data blocks carry structured fields; prose blocks stay free-form). Phase 03 supplies an isolated shared-element morph prototype; full deck-navigator transitions are Phase 06 work.
- **Component catalog:** Storybook provides isolated, token-skinned stories for every catalog block and the morph-pair prototype. It is development/review tooling, not the deck preview/export runtime.

## 4. Inputs & Outputs
- **Inputs:** `content.md` (block type references), `deck.json` (block catalog version).
- **Outputs:** rendered blocks in preview/export, morph anchor mappings.

## 5. Files & Data Touched
- **Reads:** `engine/primitives/blocks/`, `engine/primitives/motion/`, `engine/primitives/tokens/`, `engine/.storybook/`, `deck.json` (blockCatalog version).
- **Writes:** block/motion validation results (logged, not persisted to deck). Phase 03 validation checks catalog membership and required fields; full typed YAML data-schema validation is deferred hardening.

## 6. Dependencies
- `deck-format-spec.md` (blocks § 4, morph anchors § 4, data fields validation § 6).
- `system-architecture.md` (primitives layer § 4.1–4.2, versioning § 6).

## 7. Success Criteria
- [x] Block catalog v1 defines all canonical block types with required fields.
- [x] Motion vocabulary (gentle-rise, fade, none, morph) is available for per-slide declaration.
- [x] Data blocks (chart, table, stat) carry structured fields; the Phase 03 validator checks catalog membership and required fields.
- [ ] Full typed YAML data-schema validation for block fields is deferred hardening.
- [x] Matching morph anchors tween deterministically in the isolated React prototype; full deck-navigator integration is deferred to Phase 06.
- [x] Token contract is exposed for template customization (no template-specific values baked in).
- [x] Storybook builds and presents a default story for each v1 block plus the morph-pair demo.

## 8. Risks & Mitigations
- **Block type changes break decks:** versioned catalog (block-catalog v1, v2…). Old decks pin v1. Mitigation: never remove types from old catalogs.
- **Morph anchor mismatch:** validation catches unpaired/non-adjacent anchors. Mitigation: doctor reports unresolved morphs.

## 9. Open Questions
- None blocking.
