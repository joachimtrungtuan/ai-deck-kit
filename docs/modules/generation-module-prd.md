---
module: "generation"
surface: ["cli", "skill"]
status: "draft"
version: "0.1.0"
depends_on: ["presentation", "template-management"]
---

# Module PRD: Generation

## 1. Purpose
Reduces hallucination in agent-driven deck authoring via outline-first generation: input → approved outline → scaffold deck structure → agent fills blocks. CLI scaffolds structure; skill drives creative content generation.

## 2. Responsibilities
- **In scope:** outline-first workflow (structure first, content second), `aideck gen scaffold` (deck skeleton from template + outline), agent content generation for structured blocks (charts, stats, tables from data), validation of generated content against schema.
- **Out of scope:** outline approval (user/agent decides), prose-only content (delegated to presentation skill).

## 3. Surfaces
- **CLI:** `aideck gen scaffold <deck-slug> --outline <file>` (create slides from outline structure).
- **Skill:** outline-first: input → structure → fill blocks/prose. Calls CLI for scaffolding, fills content.md with structured data.
- **Runtime:** —

## 4. Inputs & Outputs
- **Inputs:** outline file (Markdown, numbered sections), deck slug, template set.
- **Outputs:** deck.json (slides added from outline), content.md (slide stubs with block placeholders), assets/ (generated graphics if any).

## 5. Files & Data Touched
- **Reads:** outline input, `deck.json`, template manifest, block catalog schema.
- **Writes:** `decks/{slug}.deck/deck.json` (new slides), `decks/{slug}.deck/content.md` (blocks with data fields), `decks/{slug}.deck/assets/` (generated images/charts).

## 6. Dependencies
- `presentation` (slide add, deck.json sync).
- `template-management` (template manifest, slide type availability).
- `design-primitives` (block types, data field schema).
- `deck-format-spec.md` (blocks § 4 with structured data fields).

## 7. Success Criteria
- [ ] `aideck gen scaffold` creates slide stubs for each outline section; syncs deck.json + content.md.
- [ ] Outline-driven scaffolding reduces prompt ambiguity vs. free-form generation.
- [ ] Generated blocks carry required structured fields (e.g., chart data series format).
- [ ] Validation catches missing/malformed block data before render.
- [ ] Skill can fill/refine generated content without losing structure.

## 8. Risks & Mitigations
- **Outline too rigid:** optional fields allow agent creativity within structure. Mitigation: schema defines required vs. optional fields per block type.
- **Generated data inaccurate:** agent reviews outline + scaffold before filling. Mitigation: separate outline approval step.

## 9. Open Questions
- None blocking.
