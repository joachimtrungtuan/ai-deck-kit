---
module: "presentation"
surface: ["cli", "skill"]
status: "draft"
version: "0.1.0"
depends_on: ["core-orchestration", "design-primitives"]
---

# Module PRD: Presentation

## 1. Purpose
Manages the lifecycle of decks and their slides. Authors/edits slide content in `content.md` while the CLI scaffolds structure and keeps `deck.json` + `content.md` in sync. The skill layer handles creative authoring; the CLI handles structural changes.

## 2. Responsibilities
- **In scope:** `aideck new` (scaffold .deck from template), `aideck slide add/remove/move` (reorder/add slides), `aideck anim toggle` (on/off animation), `aideck transition set` (declare transition type), authoring content.md, syncing deck.json ↔ content.md.
- **Out of scope:** template design, content generation, preview/export (delegated to respective modules).

## 3. Surfaces
- **CLI:** `aideck new <slug> --template <set>` (create .deck), `aideck slide add <slide-id> --type <type> --after <id>` (add slide), `aideck slide remove <id>`, `aideck slide move <id> --to <position>`, `aideck anim toggle <id>`, `aideck transition set <id> <type>`.
- **Skill:** author/edit slide content (text, visuals, speaker notes, design notes, review annotations) in content.md.
- **Runtime:** —

## 4. Inputs & Outputs
- **Inputs:** template manifest (`template-manifest.json`), content.md (human-authored prose), slide type catalog (slide_type_catalog version).
- **Outputs:** deck.json (updated slide registry + manifest), content.md (preserves prose, syncs slide ids/types/metadata).

## 5. Files & Data Touched
- **Reads:** `decks/{slug}.deck/deck.json`, `decks/{slug}.deck/content.md`, `engine/templates/{template-set}.template/template-manifest.json`.
- **Writes:** `decks/{slug}.deck/deck.json` (slide order/type/metadata), `decks/{slug}.deck/content.md` (synced slide ids, preserves existing prose).

## 6. Dependencies
- `core-orchestration` (workspace resolution, deck registry).
- `design-primitives` (block type validation).
- `deck-format-spec.md` (deck.json structure § 3, content.md schema § 4, field ownership § 5).
- `template-management` (template set resolution).

## 7. Success Criteria
- [ ] `aideck new` creates .deck folder with deck.json + content.md template.
- [ ] Slide add/remove/move updates both deck.json (order) + content.md (section ids).
- [ ] Animation/transition flags set in deck.json + content.md metadata; never lost on sync.
- [ ] Skill can edit content.md prose without altering deck.json structure.
- [ ] Validation catches slide id/type mismatches between files.

## 8. Risks & Mitigations
- **Manual deck.json edits conflict with CLI:** CLI always writes to both files atomically. Mitigation: sync is idempotent; lint warns of manual edits.
- **Lost prose on slide add/remove:** content.md sections are preserved; only moved sections are regenerated with stub text. Mitigation: careful sync logic.

## 9. Open Questions
- None blocking.
