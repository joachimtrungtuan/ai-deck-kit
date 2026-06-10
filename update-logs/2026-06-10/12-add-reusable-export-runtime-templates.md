# Add Reusable Export Runtime Templates

## What changed

- Added `skill-engineering/presentation-crafting/templates/export-runtime/` with reusable source templates:
  - `deck-export.tsx`
  - `export-shell.css`
  - `export-main.tsx`
  - `deck-registry.tsx`
  - `export.html`
  - `vite.export.config.ts`
- Added `references/export-runtime-contract.md` to define the shared preview/export shell contract.
- Updated `SKILL.md` and `references/export-workflow.md` so agents reuse or restore the runtime instead of rewriting canvas, controls, registry, or PDF page structure per deck.

## Why

Future decks and templates need a reusable starting point for the fixed 1600x900 canvas, bottom-right controls, slide picker, standalone HTML shell, and PDF `?print` capture structure. The final HTML remains standalone because these source templates are bundled into one inlined `index.html`.

## Verification

- `python3 .agents/skills/skill-creator/scripts/quick_validate.py skill-engineering/presentation-crafting`
- `node --check skill-engineering/presentation-crafting/scripts/export-pdf.mjs`
- `git diff --check -- skill-engineering/presentation-crafting`

## Follow-ups

- None.
