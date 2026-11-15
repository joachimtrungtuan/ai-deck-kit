# Export toolbar: slide picker squeezed into a 32px box

## What changed
- **Symptom:** in HTML exports (single + web), the bottom-right toolbar was too narrow and its layout broke. The slide picker label wrapped inside a tiny square.
- **Root cause:** 0974c77 (v1.5.0) replaced the native `<select>` picker with a custom button listbox. `.deck-controls button` (specificity 0,1,1) sizes the prev/next arrows as `display:grid; width:32px; height:32px; line-height:1`. It also matched the new picker trigger (`button.deck-select`) and its options (`button.deck-picker-option`). The trigger measured 32×32 with wrapped text (scrollHeight 56) and the toolbar collapsed to 213px wide.
- **Fix (`engine/preview-app/src/export-shell.css` only):**
  - New `.deck-controls .deck-select, .deck-controls .deck-picker-option` block undoes the square sizing: `display:block; height:auto; line-height:normal`, one line with ellipsis.
  - The trigger gets its own styling: auto width capped at 200px, with input-like border/background.
  - `.deck-picker-menu` gets `max-width: min(420px, calc(100vw - 40px))`.
  - Dropped the grid-only `justify-content:start` from the option rule.

## Verification
- Single mode (Playwright, served over a local http server): trigger 87×34 on one line, toolbar 269×52, menu 240×245, options 230×34 each.
  - A long injected label caps at 200px with ellipsis; the toolbar is then 381px wide.
- Web mode: identical measurements. All 7 options are 34px tall.
- `npm test` (235 pass), `build:check`, `lint`, `typecheck`, `validate` all green.

## Follow-ups
- Ship together with the iframe stylesheet fix (log 12) as patch release 1.5.2.
- No regression test covers toolbar sizing. Candidate: assert the picker trigger height ≈ the arrow-button height in the export headless check.
