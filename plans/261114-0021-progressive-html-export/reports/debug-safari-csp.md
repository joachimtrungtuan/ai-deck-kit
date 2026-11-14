# Safari CSP attribution (2026-11-14)

## Finding

The Safari 27.2 native observer report showed one normal-mode `style-src-attr` violation in both single and web outputs, while print mode had zero violations and decoded all 44 images. Firefox 160 and Chrome had zero violations. The violation is caused by the export slide gate's React inline style prop:

`engine/preview-app/src/export-slide-gate.tsx` rendered `<span style={{ width: `${percent}%` }} />`.

This is the only current export source that writes a dynamic inline style attribute in the normal export gate. The gate does not render in the print path, matching the Safari evidence. Static shell/app style writes inspected separately are CSSOM operations or React layout styles and were not implicated by the event report. No extension attribution was established or needed: the same artifact reproduced in Safari normal single and web, while Firefox and Chrome were clean.

## Fix

- Replaced the gate's React `style={{ width }}` with a ref-driven CSSOM custom-property update (`--slide-gate-progress`).
- Added the matching `width: var(--slide-gate-progress, 0%)` rule to `export-shell.css`.
- No CSP relaxation, origin allowance, unsafe hash, or observer filtering added.

## Validation

- Focused CSP/frame/generated-export tests: 5/5 pass.
- `npm test`: pass under escalated execution.
- `npm run build:check`, `npm run lint`, `npm run typecheck`, `npm run validate`: pass.
- Existing native Safari artifact evidence remains valid for print and establishes the normal-only gate correlation; a fresh Marusei rebuild is not available in this repository because the source deck is external/user-owned.

## Unresolved questions

- Fresh native Safari normal single/web rerun against the externally owned Marusei source should confirm zero events after rebuilding with the CSSOM gate fix.
