# Safari CSP attribution (2026-11-14)

## Finding

The fresh Safari 27.2 native observer report showed one normal-mode `style-src-attr` violation in both single and web outputs, while print mode had zero violations and decoded all 44 images. Firefox 160 and Chrome had zero violations. Event target metadata was `SELECT.deck-select`, attributes only `class` and `aria-label`, with no author inline style attribute. A minimal standalone strict-CSP fixture containing a plain unstyled `<select>` reproduced the same Safari event (`style-src-attr SELECT :1:1`). Therefore this is Safari native-select/CSP behavior, not React serialization, authored CSS, the observer, or an extension.

The earlier report incorrectly attributed the event to the slide gate; the minimal fixture disproves that attribution.

The affected generated control came from `engine/preview-app/src/deck-export.tsx`'s native `<select className="deck-select" aria-label="Choose slide">`.

## Fix

- Replaced the native `<select>` with an accessible button/listbox picker using existing slide navigation callbacks; keyboard navigation remains available through the picker and surrounding controls.
- No CSP relaxation, origin allowance, unsafe hash, or observer filtering added.

## Validation

- Focused CSP/frame/generated-export tests: 5/5 pass.
- `npm test`: pass under escalated execution.
- `npm run build:check`, `npm run lint`, `npm run typecheck`, `npm run validate`: pass.
- Fresh shipped-template exports pass focused browser checks; fresh Marusei Safari normal rerun against the external source is still required for final native evidence.

## Unresolved questions

- Fresh native Safari normal single/web rerun against the externally owned Marusei source should confirm zero events after the native-select replacement.
