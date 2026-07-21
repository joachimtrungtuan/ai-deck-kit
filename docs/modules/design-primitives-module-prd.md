---
module: "design-primitives"
surface: ["cli", "skill", "runtime"]
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
- **Runtime:** render blocks deterministically (data blocks carry structured fields; prose blocks stay free-form); morph transitions at runtime (shared-element anchors).

## 4. Inputs & Outputs
- **Inputs:** `content.md` (block type references), `deck.json` (block catalog version).
- **Outputs:** rendered blocks in preview/export, morph anchor mappings.

## 5. Files & Data Touched
- **Reads:** `engine/primitives/blocks/`, `engine/primitives/motion/`, `engine/primitives/tokens/`, `deck.json` (blockCatalog version).
- **Writes:** block/motion validation results (logged, not persisted to deck).

## 6. Dependencies
- `deck-format-spec.md` (blocks § 4, morph anchors § 4, data fields validation § 6).
- `system-architecture.md` (primitives layer § 4.1–4.2, versioning § 6).

## 7. Success Criteria
- [ ] Block catalog v1 defines all canonical block types with required fields.
- [ ] Motion vocabulary (gentle-rise, fade, none, morph) available for per-slide declaration.
- [ ] Data blocks (chart, table, stat) carry structured fields; schema enforced at render.
- [ ] Morph anchors on consecutive slides with same ID tween deterministically in React runtime.
- [ ] Token contract exposed for template customization (no template-specific values baked in).

## 8. Risks & Mitigations
- **Block type changes break decks:** versioned catalog (block-catalog v1, v2…). Old decks pin v1. Mitigation: never remove types from old catalogs.
- **Morph anchor mismatch:** validation catches unpaired/non-adjacent anchors. Mitigation: doctor reports unresolved morphs.

## 9. Open Questions
- None blocking.
