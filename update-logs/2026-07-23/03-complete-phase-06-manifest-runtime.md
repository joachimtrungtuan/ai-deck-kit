# Complete Phase 06 Manifest Runtime

## What changed

- Preview and HTML/PDF export now resolve a selected `.deck` through its manifest instead of a VIVIMOON registry import.
- Current-format bundles compose supported template layouts from `deck.json` + `content.md`; legacy generated source remains a local compatibility adapter only.
- Navigator uses matching adjacent morph anchors with the browser View Transition API, falling back to normal navigation when unsupported or unmatched.
- Pack archives preserve the `.deck` folder boundary and omit generated `.build/` output. PDF capture now freezes entrance animations under Chrome screenshot capture.
- VIVIMOON is documented as a read-only legacy reference; current-format smoke decks define Phase 06 round-trip validation.

## Why

Remove the per-deck runtime registry boundary without rewriting legacy presentation content.

## Validation

- `validate-slide-content.mjs` passed for a current-format smoke deck.
- Current-format `export html`, `pack`, `unpack`, and re-export produced byte-identical HTML.
- VIVIMOON dynamic HTML/PDF export passed: 12 landscape pages; raster first-page visual QA clean.
- Typecheck still reports the pre-existing Storybook module-resolution issue for `@storybook/react-vite`.

## Follow-ups

- Phase 07 distribution installer and upgrade flow.

## Unresolved questions

None.
