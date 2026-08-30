# Sidebar toggle alignment, items[] block-style lint, rich-text support

## What changed

**Issue 1 — sidebar toggle button position.** The collapse/expand button in
`engine/preview-app` was positioned relative to the deck title instead of the
sidebar/stage dividing line. Repositioned it to sit centered on the divider
(`engine/preview-app/src/main.tsx`, `preview-shell.css`), and stopped its click
from bubbling into the divider's resize-drag handler.

**Issue 2 — `items[]` readability.** v2 content schema list-item objects were
being written as single-line flow mappings (`- {title: "...", description:
"..."}`), hard to scan in an IDE. Approved scope: docs + validator lint, no
schema version bump.
- `engine/schemas/content-schema-guidance.md`: new "`items[]` Formatting"
  section mandating YAML block style (one field per line).
- Both templates' `schema-guidance.md` and
  `engine/skills/content-schema-migration/references/v1-v2-field-mapping.md`:
  updated to the same block-style instruction.
- `engine/skills/presentation-crafting/scripts/validate-slide-content.mjs`:
  new non-fatal `warnings` array (separate from the fatal `errors` array).
  Detects flow-style `items:` (`items: [...]`) and flow-style entries
  (`- {...}`) scoped to just the `items:` YAML section, via a regex-based
  extraction helper (`v2ExtractItemsSection`). Warnings print but don't fail
  validation — first use of a warnings mechanism in this validator.

**Issue 3 — rich text in paragraphs.** Approved scope: HTML-ish tags (`<b>
<i> <ul> <ol> <li> <br>`), applied to body/description paragraphs, list-item
descriptions, and titles/kickers only (not attribution, leftTitle/rightTitle,
source, index, or StatBlock values).
- New `engine/primitives/blocks/rich-text.tsx`: whitelist tag-tokenizer
  (`renderRichText`), not a markdown lib, no `dangerouslySetInnerHTML`.
  Unrecognized tags render as literal text.
- Swept into `text-block.tsx`, `title-description-block.tsx`,
  `icon-text-card-block.tsx`, and the approved-scope text fields across both
  templates' React layouts (`shared.tsx` and per-category layout files).
- `templateVersion` bumped `2.0.1` → `2.0.2` in both template manifests
  (patch: backward-compatible, same props, plain text unaffected).

## Why

User request via `/ak-fix`: toggle button was visually misaligned to the
divider; `items[]` single-line YAML was hard to track in an IDE; paragraph
text had no styling options. All three scoped and approved via
`AskUserQuestion` before implementation (Issue 2 explicitly capped at
docs+lint, not a schema version bump; Issue 3 scoped to the tag set and field
list above).

## Verification

- `npx tsc --noEmit` (engine) — clean.
- `npm run lint` — "Lint passed: 11 JavaScript files checked."
- `npm run validate` — both template manifests valid, template validators
  passed, release package check passed.
- Browser verification: toggle button centered on divider, collapses/expands
  without triggering divider drag; plain text (no rich-text tags) renders
  unchanged (regression check on the "agenda" slide, Vietnamese text).
- Validator warning tested against a throwaway deck built inside the real
  project's gitignored `decks/` dir (needed for template-manifest
  resolution): flow-style `items[]` produces the warning and still exits 0;
  block-style produces no warning. Throwaway deck deleted after testing.

## Follow-ups

None. All three issues fully implemented and verified.
