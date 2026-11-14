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

## Superseding evidence

The earlier unresolved note is closed. The fresh native Safari 0974 artifact
rerun (`/tmp/marusei-097-artifacts/runtime.jsonl`) confirms normal single/web
and print modes report zero CSP violations; Firefox web/print also report zero.
The final picker review adds current Chrome interaction evidence. The remaining
CLI `134` observation is documented separately as a managed-sandbox Chrome
launch failure, not a Safari/CSP product defect.

## Picker interaction follow-up

The native select was replaced by a strict-CSP button/listbox picker. It now supports roving active options, Arrow/Home/End, typeahead, Enter/Space commit, Escape/Tab close, ARIA trigger/listbox relationships, parent/frame outside dismissal, blur dismissal, unique option ids, and empty-slide fallback. Automated gates remain green after this interaction-only change.

## Current-code picker verification (2026-11-15)

The shipped Swiss Modern `presenter-test` deck (7 slides) was rebuilt from the current source into `decks/presenter-test.deck/.build/export/index.html` and served on loopback. Chrome exercised that generated export, not the stale `/tmp/marusei-097` artifact.

All targeted cases passed: open; Arrow navigation with committed state unchanged; End; typeahead (`title`); Enter and Space commit; Escape and Tab close; focus restore after Enter/Escape; outside parent pointer close; global deck-key isolation while open; and click inside the loaded slide iframe close. The temporary server and Chrome process were stopped afterward.

The CLI export's file-URL CSP probe still reports its known local-file runtime failure, but the same generated `index.html` ran successfully over loopback for the interaction proof. No CSP allowance changed.
