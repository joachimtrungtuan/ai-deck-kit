# Update Presentation Crafting Export Skill

## What changed

- Updated `skill-engineering/presentation-crafting/SKILL.md` with:
  - shorter trigger description
  - explicit scope
  - mandatory visual PDF QA
  - Chrome + ImageMagick flattened PDF wording
  - security block for skill quality
- Updated `skill-engineering/presentation-crafting/references/export-workflow.md` with:
  - finalized standalone HTML export behavior
  - temp export comparison command against VIVIMOON `index.html`
  - flattened PDF export process
  - macOS Preview failure rationale
  - required PDF metadata + raster visual checks
- Aligned implementation comments in `export-pdf.mjs`, `deck-export.tsx`, and `export-shell.css`.

## Why

The previous skill docs still described Chrome `--print-to-pdf`, but the working engine now creates a lightweight flattened PDF that renders cleanly in macOS Preview. Future agents need to verify exported PDFs visually, not only by script success.

## Verification

- Re-exported VIVIMOON HTML to `/tmp/vivimoon-html-export-check`.
- Confirmed temp HTML output has one file: `index.html`.
- Confirmed temp HTML matches canonical export with `cmp -s` exit code `0`.
- `node --check skill-engineering/presentation-crafting/scripts/export-pdf.mjs`
- `python3 .agents/skills/skill-creator/scripts/quick_validate.py skill-engineering/presentation-crafting`
- `git diff --check`

## Follow-ups

- None.
