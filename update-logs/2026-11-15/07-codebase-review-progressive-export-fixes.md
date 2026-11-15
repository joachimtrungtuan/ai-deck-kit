# Codebase review — progressive export fixes

**What changed**
- `engine/preview-app/src/export-asset-loader.ts`: added `isStartupSettled()` (every startup asset ready *or* failed). `order()` and `pump()` now gate the rest-of-deck queue on settled, not loaded. Before, one failed startup image held the remaining slides back forever, so the PDF capture (`isAllReady`) and later slides never loaded.
- `engine/cli/tests/export-asset-loader.test.ts`: regression test "a failed startup asset does not stop the rest of the deck from loading" (fails without the fix).
- `engine/preview-app/src/deck-export.tsx`: `PrintDeck` page keys are now `${id ?? type}-${index}`, so slides sharing an id/type no longer collide.
- `engine/skills/presentation-crafting/scripts/export-html-csp-headless-check.mjs`: new `chromeDumpIsJudgeable()`: a non-zero Chrome exit no longer fails the check when the dumped DOM carries the recorder marker, and a spawn timeout is judged when the dump also carries `data-export-ready="true"`; the DOM (violations) decides. Headless Chrome on macOS sometimes crashes or hangs on teardown ("Trying to load the allocator multiple times") after a clean dump, which flaked `export-mode-flag.test.ts` in two gate runs. Other spawn errors and marker-less dumps still fail closed.
- `engine/cli/tests/export-html-csp-headless-check.test.ts`: fake-Chrome regression test (clean DOM + exit 1 passes; violations + exit 1 still named; no marker + exit 1 still fails) and timeout cases for `chromeDumpIsJudgeable` (typed in the sibling `.d.mts`).
- `engine/cli/commands/output.ts`: new `pdfOutputPath(deckRoot)` names the PDF after the bundle slug. `runExport` used the raw argument, so `foo.deck` wrote `foo.deck.pdf` and `decks/foo.deck` pointed at a nonexistent nested folder and failed. `export-mode-flag.test.ts` covers all three argument forms; `dist` rebuilt.

**Why**: comprehensive review requested after the progressive-export plan closed.

**Review coverage, no defect found**: CLI `commands/` (removal, upgrade, output pack/unpack), `lib/fs.ts`, `lib/deck.ts` path guards, `lib/templates.ts` layout containment, `lib/deck-template-sync.ts`, export asset loader + slide gate, PDF export script.

**Follow-ups (unverified candidates, not fixed)**
- `collectOverrideCss` greedy regexes; `moveAppScriptIntoBody` assumes one script shape; Google Fonts referenced outside `<style>` are not embedded.
- `vite-deck-plugin.ts` is 538 lines (over the size cap); `deckAssets` expression repeated.
