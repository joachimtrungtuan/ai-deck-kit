# Export toolbar toggle doc impact

## What changed

- Kept `engine/skills/presentation-crafting/references/export-workflow.md` as the author-facing usage note for the standalone export toolbar toggle.
- Updated `engine/skills/presentation-crafting/references/export-runtime-contract.md` to record the runtime control invariant: visible by default, toggleable with `Shift+I` or export-canvas right-click, keyboard navigation preserved while hidden, native context menu suppressed in screen export mode.

## Why

Phase 2 changed a durable export-runtime behavior. The workflow guide already covered how to use it; the runtime contract also needed the invariant so future runtime edits do not silently drop it.

## Follow-ups

- `npm run validate` passed after the doc update.
