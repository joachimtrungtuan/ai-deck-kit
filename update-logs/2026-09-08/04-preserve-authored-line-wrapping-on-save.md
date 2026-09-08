# Preserve authored line wrapping when saving a slide from the field editor

## What changed

Saving a slide re-serializes its whole YAML fence, and the serializer folds any scalar
wider than its default column limit. Editing one field therefore re-wrapped untouched
neighbours: on the showcase deck, `imageAlt: "Dashboard mock showing rainfall bars,
temperature line, and a green health badge"` came back split across two lines after an
unrelated title edit.

The save path now renders through a `serializeYamlDocument` helper in
`engine/preview-app/src/yaml-document-edit.ts` that disables folding, next to the other
formatting-preserving edit helpers. `engine/preview-app/src/slide-field-editor.tsx` calls
it instead of `String(document)`.

Regression test in `engine/cli/tests/yaml-document-edit.test.ts`: a document holding a
long quoted scalar and a literal block scalar, edited in one unrelated field, must come
back byte-identical apart from that field. It fails without the change.

Version 1.1.0 → 1.1.1 across `package.json`, `ai-deck-kit.json`,
`engine/engine.version.json`, `engine/package.json`, the engine lockfile, and the catalog
test pin.

## Why

The write path exists to leave authored formatting alone — comments, quote styles and
blank lines already survive an edit. Re-wrapping a line nobody touched contradicts that,
and shows up as diff noise in the deck author's git history.

## Follow-ups

- Disabling folding is global, so a scalar authored as a folded block (`>` / `>-`) with
  its own internal line breaks would now be written back on one line. No example deck or
  shipped template uses folded scalars — the block scalars in use are all literal
  (`|` / `|-`), whose line breaks are part of the value and are unaffected. Revisit only
  if folded scalars appear in real content.
- Gates run: typecheck, lint, test (116 pass), build:check, validate, test:smoke. The fix
  is covered by the unit test above; the live `aideck serve` pass was not repeated.
