---
module: "preview"
surface: ["cli", "runtime"]
status: "draft"
version: "0.1.0"
depends_on: ["design-primitives"]
---

# Module PRD: Preview

## 1. Purpose
Serves a shared React preview app that renders any .deck via manifest resolver. No hardcoded paths or per-template apps. Read-only review in browser; morph transitions render at runtime.

## 2. Responsibilities
- **In scope:** `aideck serve [<deck-slug>]` (start preview server), manifest resolver (discovers .deck path from ai-deck-kit.json), render deck by reading deck.json + content.md + template, morph transitions at runtime, read-only UI (no in-browser edits).
- **Out of scope:** content authoring (delegated to presentation skill), export (owned by export-package).

## 3. Surfaces
- **CLI:** `aideck serve [<deck-slug>] [--port <port>]` (start server, open browser).
- **Skill:** —
- **Runtime:** React app (Vite dev server), reads deck.json + content.md + template on load, renders slides with morph animation on transitions.

## 4. Inputs & Outputs
- **Inputs:** ai-deck-kit.json (workspace), `decks/{slug}.deck/deck.json`, `decks/{slug}.deck/content.md`, template snapshot in .deck/template/, assets/.
- **Outputs:** rendered HTML in browser, morph state updates on slide change.

## 5. Files & Data Touched
- **Reads:** `ai-deck-kit.json`, `decks/{slug}.deck/*`, `engine/primitives/blocks/`, template manifest (both engine-side and embedded).
- **Writes:** none (read-only).

## 6. Dependencies
- `design-primitives` (block types, motion vocabulary, morph anchors).
- `core-orchestration` (workspace resolution).
- `deck-format-spec.md` (manifest § 3, content layout § 4, morph anchors § 4).
- External: Node.js, Vite, React.

## 7. Success Criteria
- [ ] `aideck serve` discovers .deck from CWD or ai-deck-kit.json.
- [ ] Preview loads deck.json + content.md + embedded template without network calls.
- [ ] Slides render correctly with blocks, text, images, speaker notes visible.
- [ ] Morph transitions (same anchor id on consecutive slides) animate smoothly.
- [ ] Read-only; no in-preview edits (edits via content.md + CLI).

## 8. Risks & Mitigations
- **Manifest resolver fails:** preview falls back to workspace default or errors with clear message. Mitigation: doctor pre-validates workspace.
- **Template snapshot missing:** preview uses engine-side template as fallback. Mitigation: aideck new always embeds.

## 9. Open Questions
- None blocking.
