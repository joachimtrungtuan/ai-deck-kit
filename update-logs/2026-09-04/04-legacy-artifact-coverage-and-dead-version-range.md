# Legacy-artifact test coverage (F4) and the dead template version range (F5)

## What changed

- `engine/cli/lib/deck.ts` — `LEGACY_CONTENT_SCHEMA_VERSION` now lives here and is
  exported; `slideContent`'s default parameter was `"3.0.0"` and is now that
  constant. `createDeck` no longer copies an absent template `contentSchemaVersion`
  into the deck manifest it writes.
- `engine/cli/lib/deck-template-sync.ts` — imports the shared constant instead of
  declaring its own copy.
- `engine/cli/tests/deck-lifecycle.test.ts` — third legacy-deck test: `slide add`
  on a fieldless deck must produce v1 grammar.
- `engine/engine.version.json` — `templateVersionRange` removed.

## Why

**F4 was not just a coverage gap — it was hiding a live bug.** Writing the missing
test found a second instance of F1 that the earlier fix did not reach:
`slideContent(slide, title, contentSchemaVersion = "3.0.0")` combined with
`presentation.ts:59` passing `loaded.manifest.contentSchemaVersion` straight
through. On a deck with no recorded schema the default fired, so `aideck slide add`
appended a v3 block (`description`, `items`, `override.css`, `override.html`) to a
v1 `content.md`. The grammars share almost no fields; the deck's own validator
would then reject content the CLI itself had written. Reproduced before fixing.

The constant moved to `deck.ts` because two modules now need it — one meaning,
one definition.

**F5 dropped rather than enforced.** `templateVersion` is an author-controlled
counter bumped on every template edit; it carries no engine-compatibility meaning,
which `contentSchemaVersion` and `slideTypeCatalog` already carry. Enforcing
`">=2.0.0 <4.0.0"` would have rejected every template the CLI scaffolds —
`createTemplate` seeds `1.0.0`, below the declared floor. The shipped templates
satisfy the range only by coincidence. A contract that would reject its own
generator is not a contract worth wiring up.

## Verification

- `npm test` — 100/100 (was 99).
- Vacuous-test guard: flipping only `slideContent`'s default back to `"3.0.0"`
  fails exactly the new test; restored, back to green.
- `npm run typecheck`, `npm run lint`, `npm run build`, `npm run validate` — clean.

## Follow-ups

- The `content-schema-migration` skill still has no branch for a bundle that is
  neither v1 nor a schema the kit records.
- Legacy coverage is now three cases (fieldless deck: re-sync refusal, stamping,
  slide add; plus the fieldless template manifest). Other pre-update deck shapes —
  a legacy frozen snapshot inside an otherwise current deck — remain untested.
