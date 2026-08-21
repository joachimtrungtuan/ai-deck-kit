---
module: "preview"
surface: ["cli", "runtime"]
status: "draft"
version: "0.1.0"
depends_on: ["design-primitives"]
---

# Module PRD: Preview

## 1. Purpose
Serves one shared React preview app for the installed-template gallery, a selected .deck, or a selected template. No per-template or per-deck apps. Review is read-only in the browser; source edits remain agent-owned. The preview may persist local UI preferences, such as sidebar width and collapsed state, in browser `localStorage`.

## 2. Responsibilities
- **In scope:** `aideck serve`, positional and flag-based deck/template targets, browser auto-open with `--no-open` opt-out, workspace target resolution, template structural validation, live reload, read-only UI, and morph transitions at runtime.
- **Out of scope:** content authoring (delegated to presentation skill), export (owned by export-package).

## 3. Surfaces
- **CLI:** `aideck serve [<deck-slug> | deck <slug> | template <name> | --deck <slug> | --template <name>] [--port <port>] [--no-open]`.
- **Skill:** —
- **Runtime:** React app (Vite dev server), reads deck.json + content.md + template on load, renders slides with morph animation on transitions, and attaches the same keyboard-navigation handler to the outer window and the slide iframe window. Advance keys are Right, Down, PageDown, and Space; reverse keys are Left, Up, and PageUp; Home jumps to the first slide; End jumps to the last slide. INPUT, SELECT, and `[data-agentation-root]` targets keep native behavior.

## 4. Inputs & Outputs
- **Inputs:** ai-deck-kit.json (workspace), `decks/{slug}.deck/deck.json`, `decks/{slug}.deck/content.md`, `templates/{name}.template/` user drafts, installed `engine/templates/{name}.template/`, template snapshots, and assets/.
- **Outputs:** rendered HTML in browser, morph state updates on slide change.

## 5. Files & Data Touched
- **Reads:** `ai-deck-kit.json`, `decks/{slug}.deck/*`, `templates/{name}.template/*`, `engine/templates/{name}.template/*`, and `engine/primitives/blocks/`.
- **Writes:** browser-local UI preferences only (`localStorage`); no deck source or project files are written by the preview.

## 6. Dependencies
- `design-primitives` (block types, motion vocabulary, morph anchors).
- `core-orchestration` (workspace resolution).
- `deck-format-spec.md` (manifest § 3, content layout § 4, morph anchors § 4).
- External: Node.js, Vite, React.

## 7. Success Criteria
- [x] Bare `aideck serve` opens a gallery built from every template the project can resolve, with no per-template registration file.
- [x] Bare deck slugs, `deck`/`template` subcommands, and `--deck`/`--template` flags select one read-only preview target.
- [x] Ambiguous targets, conflicting forms, missing values, and unknown arguments fail with a usage error instead of opening the gallery.
- [x] Template preview resolves the project's `templates/` copy over the shipped default, validates its required structure, and errors naming both locations when neither resolves.
- [x] `serve` prints what it resolved (deck path, or template name + origin + version + path) before Vite starts.
- [x] A template name passed as a deck fails with the correct command instead of rendering the wrong target.
- [x] No template is named in runtime source; all template CSS and components arrive through `virtual:aideck-deck`.
- [x] Gallery entries alias components per template, so same-named exports across templates cannot collide; an unresolvable template is omitted rather than fatal.
- [x] Template preview expands every declared layout variant and falls back to one slide per supported type when no variants are declared.
- [x] The browser opens by default; `--no-open` supports automation.
- [x] Bare serve presents a dedicated template-gallery page; selecting a card opens the template viewer.
- [x] Deck and template review share the same fixed-canvas viewer, with a viewport-height stage and independently scrolling slide list.
- [x] Live preview keyboard navigation works from both the shell and the slide iframe, matching export navigation keys while preserving native INPUT, SELECT, and Agentation interactions.
- [ ] Preview loads deck.json + content.md + embedded template without network calls.
- [ ] Slides render correctly with blocks, text, images, speaker notes visible.
- [ ] Morph transitions (same anchor id on consecutive slides) animate smoothly.
- [x] Read-only; no in-preview edits (edits happen in source through the agent workflow).

## 8. Risks & Mitigations
- **Manifest resolver fails:** preview falls back to workspace default or errors with clear message. Mitigation: doctor pre-validates workspace.
- **Template snapshot missing:** the plugin resolves the source template project-first and errors with the `deck retemplate` command when neither location has it. It never substitutes a different template — a silent fallback is how a deck ends up rendered in the wrong styling. Mitigation: `aideck new` always embeds a snapshot.

## 9. Open Questions
- None blocking.
