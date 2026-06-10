---
name: presentation-crafting
description: Create beautifully crafted browser presentations from user-provided content. Use when the user wants a React-first or standalone HTML slide deck, canonical slide-content Markdown, strict slide design consistency, controlled layout or animation overrides, speaker notes, review annotations, or a repeatable agent workflow for polished decks. Not for authoring template sets — use presentation-template-creation for that.
---

# Presentation Crafting

Create polished browser presentations through a controlled content-first workflow. Treat this skill as a collaboration protocol: normalize content, choose one template system, generate from source, verify consistency, then iterate through explicit annotations.

## Core Principles

- Keep one canonical Markdown content file per deck.
- Use one and only one template set per presentation.
- Derive every slide from a declared slide type in the active slide-type catalog.
- Prefer React source for systematic decks; export static HTML when the user needs portable delivery.
- Allow overrides only when they are explicit, justified, and recorded in the content file.
- Do not recreate Google Slides. The agent edits source; the user reviews content and rendered output.
- Use one shared React preview runtime for template and deck review. Do not create a separate React app per template or per presentation.

## Workflow

1. Read the available user material.
2. If the user already provides slide-by-slide structure, preserve it and normalize it into the canonical slide-content schema.
3. If the user provides raw notes, top-line ideas, transcripts, or long-form text, propose a slide-by-slide structure before generating the deck.
4. Save or update the canonical content file under `presentation/working-files/{presentation-slug}/content/`.
5. Select exactly one template set. If no suitable template exists, stop and switch to the `presentation-template-creation` skill to author one — never improvise a deck style.
6. Map every slide to a known slide type from the active catalog. Use `references/slide-types-v1.md` for the v1 baseline.
7. Generate or update the React presentation source under `presentation/working-files/{presentation-slug}/source/`.
8. Review templates or deck source in the shared preview runtime under `presentation/preview-app/` before export.
9. Export static HTML under `presentation/working-files/{presentation-slug}/export/` when requested or useful.
10. Run validation:
   - `node skill-engineering/presentation-crafting/scripts/validate-slide-content.mjs <content-file>`
11. Review the rendered deck for template consistency, text fit, responsive framing, icon style, animation restraint, and asset rendering.

## User Intake

Ask only what blocks progress. Default questions:

- Is the content already broken down by slide, or should I structure it from raw material?
- Which existing template set should this deck use?
- Should the output be React source only, static HTML export, or both?

If the user has not chosen a template set and multiple options exist, recommend one based on audience and presentation purpose.

## Required Folder Structure

Use the structure in `references/folder-structure.md`. Keep all deck artifacts under `presentation/`.

The expected deck unit is:

```text
presentation/working-files/{presentation-slug}/
├── content/{presentation-slug}.slides.md
├── source/
├── assets/
└── export/
```

## References

- `references/content-normalization-workflow.md` - Convert raw material into slide-ready content.
- `references/canonical-slide-content-schema.md` - Required Markdown schema for each deck.
- `references/folder-structure.md` - Repository layout for templates and working files.
- `references/slide-types-v1.md` - Required v1 slide-type catalog.
- `references/annotation-policy.md` - Where to put speaker notes, design notes, review notes, and change intent.
- `references/icon-policy.md` - Phosphor-first icon guidance and icon-font tradeoffs.
- `references/animation-presets.md` - Approved animation vocabulary.
- `references/preview-runtime.md` - Shared React preview app rules.
- `references/quality-gate.md` - Final review checklist before handoff.

Template authoring (manifests, catalogs, versioning, new template sets) lives in the sibling `presentation-template-creation` skill — this skill only consumes templates.

## Scripts

- `scripts/validate-slide-content.mjs` checks frontmatter and slide block metadata in a canonical content file.

## Reporting

When reporting back, include:

- Content file path.
- Template set used.
- Output path.
- Validation result.
- Unresolved questions at the end, if any.
