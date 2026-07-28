---
module: "preview"
surface: ["cli", "runtime"]
status: "draft"
version: "0.1.0"
depends_on: ["design-primitives"]
---

# Module PRD: Preview

## 1. Purpose
Serves one shared React preview app for the installed-template gallery, a selected .deck, or a selected template. No per-template or per-deck apps. Review is read-only in the browser; source edits remain agent-owned.

## 2. Responsibilities
- **In scope:** `aideck serve`, `aideck serve --deck <slug>`, `aideck serve --template <name>`, browser auto-open with `--no-open` opt-out, workspace target resolution, template structural validation, live reload, read-only UI, and morph transitions at runtime.
- **Out of scope:** content authoring (delegated to presentation skill), export (owned by export-package).

## 3. Surfaces
- **CLI:** `aideck serve [--deck <slug> | --template <name>] [--port <port>] [--no-open]`.
- **Skill:** —
- **Runtime:** React app (Vite dev server), reads deck.json + content.md + template on load, renders slides with morph animation on transitions.

## 4. Inputs & Outputs
- **Inputs:** ai-deck-kit.json (workspace), `decks/{slug}.deck/deck.json`, `decks/{slug}.deck/content.md`, `templates/{name}.template/` user drafts, installed `engine/templates/{name}.template/`, template snapshots, and assets/.
- **Outputs:** rendered HTML in browser, morph state updates on slide change.

## 5. Files & Data Touched
- **Reads:** `ai-deck-kit.json`, `decks/{slug}.deck/*`, `templates/{name}.template/*`, `engine/templates/{name}.template/*`, and `engine/primitives/blocks/`.
- **Writes:** none (read-only).

## 6. Dependencies
- `design-primitives` (block types, motion vocabulary, morph anchors).
- `core-orchestration` (workspace resolution).
- `deck-format-spec.md` (manifest § 3, content layout § 4, morph anchors § 4).
- External: Node.js, Vite, React.

## 7. Success Criteria
- [x] Bare `aideck serve` opens the shared installed-template gallery.
- [x] `--deck` and `--template` select one read-only preview target and cannot be combined.
- [x] Template preview prefers a user draft, falls back to the installed template, and validates its required structure.
- [x] The browser opens by default; `--no-open` supports automation.
- [x] Bare serve presents a dedicated template-gallery page; selecting a card opens the template viewer.
- [x] Deck and template review share the same fixed-canvas viewer, with a viewport-height stage and independently scrolling slide list.
- [ ] Preview loads deck.json + content.md + embedded template without network calls.
- [ ] Slides render correctly with blocks, text, images, speaker notes visible.
- [ ] Morph transitions (same anchor id on consecutive slides) animate smoothly.
- [x] Read-only; no in-preview edits (edits happen in source through the agent workflow).

## 8. Risks & Mitigations
- **Manifest resolver fails:** preview falls back to workspace default or errors with clear message. Mitigation: doctor pre-validates workspace.
- **Template snapshot missing:** preview uses engine-side template as fallback. Mitigation: aideck new always embeds.

## 9. Open Questions
- None blocking.
