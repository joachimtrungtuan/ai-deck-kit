# Fix: `aideck doctor`/`verify` rejected documented named slide-type catalog profiles

**What changed.** `engine/cli/commands/verify.ts` `checkDeck()` no longer compares
`manifest.slideTypeCatalog` against the literal `["v1", "v2"]` allowlist alone. New helper
`isSupportedSlideTypeCatalog(catalog, supported, templateName)` also accepts a catalog matching
`^${templateName}-v\d+$`, where `templateName` is the deck's own `manifest.template.set`. Since
`deck-template-sync.ts` always copies `slideTypeCatalog` verbatim from the template that produced the
deck, this pattern can only ever match a profile that exact template declared for itself — never an
arbitrary string. Rebuilt `engine/cli/dist/commands/verify.js` (checked-in build must match source per
`scripts/check-cli-build-is-current.mjs`).

**Why.** `template-system.md` ("Rules", item 3) documents named, versioned compact catalog profiles as
a supported pattern for templates whose use case is narrower than the general catalog (e.g.
`clarity-courseware-v1` with 10 custom slide types). `verify.ts` never implemented that allowance — it
only ever accepted the two literal engine catalog names — so any conforming template produced a
false-positive `unsupported slide-type catalog` error on every `aideck doctor`/`verify` run, which also
fails the workspace's verify-based stop hook. Confirmed against the reported external repro
(`clarity-courseware.template` → `claude-lesson-1-5.deck`, both declaring `"clarity-courseware-v1"`):
code and docs disagreed, this was an engine bug, not a template-authoring mistake.

**Scope decision.** The bug report's suggested fix #3 (add "must enumerate every supported type and
remain additive" validation to `validateTemplateManifest`) was left out — enforcing "additive to the
general catalogs" needs a semantic type-compatibility model that doesn't exist yet anywhere in the
codebase, and the corrected `verify.ts` already independently rejects any catalog name a template
didn't declare for itself (see test below), so there's no exploitable gap left by skipping it.

**Tests.** New `engine/cli/tests/verify-slide-type-catalog.test.ts` (2 cases, via `verifyWorkspace()`
end-to-end against fixture workspaces): a deck using its own template's named profile passes; a catalog
name that doesn't match the deck's own template is still rejected. Both fail without the fix (pre-fix
logic can only ever match the literal `v1`/`v2` strings). Full suite: `test:lifecycle` 6/6,
`test:boundary` 12/12, new test 2/2 — all pass. `npm run typecheck` and `npm run lint` clean.

**Version bump.** Patch bump 0.3.1 → 0.3.2 in `package.json`, `engine/package.json`,
`engine/engine.version.json`, `ai-deck-kit.json` (bug fix, no API/contract change) — same convention as
`01-fix-deck-relative-asset-resolution.md` earlier today.

**Docs impact:** none — `template-system.md` already documented this as supported; the code now matches
the existing docs, nothing to update.
