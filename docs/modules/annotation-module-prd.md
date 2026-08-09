---
module: "annotation"
surface: ["cli", "runtime"]
status: "draft"
version: "0.1.0"
depends_on: ["presentation"]
---

# Module PRD: Annotation

## 1. Purpose
Reuses existing in-content annotation approach (Speaker Notes, Design Notes, Review Questions in content.md). No new mechanism; module validates & surfaces annotations, referenced by presentation-crafting skill.

## 2. Responsibilities
- **In scope:** `aideck validate` surfaces annotations, enforce annotation presence per slide (e.g., speaker notes required for all slides), annotation policy enforcement, validation against `annotation-policy.md`; a preview-time feedback toolbar (`agentation`, mounted in `engine/preview-app/src/main.tsx`) for click-to-annotate review of the rendered slide.
- **Out of scope:** annotation storage (lived in content.md sections).

## 3. Surfaces
- **CLI:** `aideck validate [<deck-slug>]` (report missing annotations, structural issues); output includes annotation summary (speaker notes counts, review question counts).
- **Skill:** —
- **Runtime:** `aideck serve --deck <id>` and `aideck serve --template <name>` both mount the
  `agentation` feedback toolbar (npm package, devDependency of `engine/`) as a sibling of the
  shared `AppRouter` in `main.tsx`, so every preview route — deck, single template, and the
  template gallery — gets it with default config and no target-specific code. A reviewer clicks
  an element on the rendered slide, writes a note, and copies the notes as structured output to
  paste into an AI agent. This is dev-preview-only: the export entry point (`export-main.tsx` →
  `DeckExport`) is a separate Vite build that never imports `main.tsx`, so `aideck export
  html/pdf` output never contains the toolbar.

## 4. Inputs & Outputs
- **Inputs:** `content.md` (annotation sections: Speaker Notes, Design Notes, Review Questions).
- **Outputs:** validation report (list of slides with missing annotations, counts by type).

## 5. Files & Data Touched
- **Reads:** `decks/{slug}.deck/content.md`, annotation policy rules.
- **Writes:** validation report (stdout/log; not persisted to deck). The feedback toolbar's own
  notes are held in-browser by `agentation` and copied out manually — nothing is written back to
  `content.md` or the deck bundle by this module.

## 6. Dependencies
- `presentation` (content.md sections, field ownership).
- `presentation-crafting/references/annotation-policy.md` (section names, required/optional rules).
- `deck-format-spec.md` (content.md structure § 4).
- `agentation` (npm, devDependency of `engine/`) — third-party feedback toolbar; see
  `THIRD_PARTY_NOTICES.md`.

## 7. Success Criteria
- [ ] Validation detects missing speaker notes, design notes, or review questions per configured rules.
- [ ] Report groups findings by slide + annotation type.
- [ ] Annotation policy (e.g., "all slides must have speaker notes") enforced before export.
- [ ] No new data format needed; reuses existing content.md sections.
- [x] Feedback toolbar present by default in `aideck serve --deck`/`--template`, absent from
      `aideck export html/pdf` output.

## 8. Risks & Mitigations
- **Over-enforcement:** annotation policy rules configurable per deck or project. Mitigation: config flag in deck.json or ai-deck-kit.json.
- **Annotation loss on sync:** presentations module preserves annotation sections. Mitigation: careful sync logic in presentation module.

## 9. Open Questions
- None blocking.
