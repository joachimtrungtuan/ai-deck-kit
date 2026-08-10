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
- **In scope:** `aideck validate` surfaces annotations, enforce annotation presence per slide (e.g., speaker notes required for all slides), annotation policy enforcement, validation against `annotation-policy.md`; a preview-time feedback toolbar (`agentation`, injected into the slide iframe by `engine/preview-app/src/fixed-slide-canvas.tsx`) for click-to-annotate review of individual elements on the rendered slide.
- **Out of scope:** annotation storage (lived in content.md sections).

## 3. Surfaces
- **CLI:** `aideck validate [<deck-slug>]` (report missing annotations, structural issues); output includes annotation summary (speaker notes counts, review question counts).
- **Skill:** —
- **Runtime:** `aideck serve --deck <id>` and `aideck serve --template <name>` render slide
  content inside a fixed 1600×900 `<iframe>` (`FixedSlideCanvas`, so `vw`/`vh` CSS resolves
  against a pinned canvas instead of the real window — see `system-architecture.md`). Agentation
  cannot see across that iframe boundary (same-origin isolation; vendor-confirmed, no
  iframe-targeting API), so mounting it in the parent document — the old approach — made the
  entire slide canvas one opaque, unselectable element. Instead, `FixedSlideCanvas` (when given
  `mountAgentation`) injects a dedicated module script
  (`engine/preview-app/src/iframe-agentation-entry.tsx`) directly into the slide iframe's own
  document, so Agentation's click-picker runs in that document's realm and can select individual
  slide elements. `PreviewApp` in `main.tsx` is the only caller that sets `mountAgentation`; the
  export pipeline's `ScreenDeck` (`deck-export.tsx`) reuses the same `FixedSlideCanvas` without it,
  so exported output never gets the toolbar. The template gallery route (`TemplateGallery`) never
  renders slide content — its cards are static index/label tiles — so it has no toolbar and needs
  none. A reviewer clicks an element on the rendered slide, writes a note, and copies the notes as
  structured output to paste into an AI agent. This is dev-preview-only: the export entry point
  (`export-main.tsx` → `DeckExport`) is a separate Vite build that never imports `main.tsx` or
  `iframe-agentation-entry.tsx`, so `aideck export html/pdf` output never contains the toolbar.

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
