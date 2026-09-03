# Phase 3 + 4 review fixes

Follow-up to the code review of phase 3 (showcase deck) and phase 4 (diagram IR v1).
Review verdict was PASS on spec compliance for both; these are the quality findings.

## What changed

**Test that could not fail (finding 1).** `diagram-ir.test.ts` asserted the override overlay's
z-index with a regex over the *source text* of `slide-override-layer.tsx`, matching exact inline
style property order. It broke on reformatting and passed even if the layer never rendered.
Replaced with three order-independent invariant checks: overlay style values parsed individually,
both render sites emit the layer after `<slide.Component>`, and no shipped template declares a
z-index above the cap the overlay assumes. Mutation-tested: lowering zIndex fails, reordering the
style props does not.

**Dead branch in the deck validator (finding 2).** The diagram override's scope-class and
`layout/animation === "none"` checks were nested inside the "IR file exists" branch, so a deck that
lost its IR skipped them. Hoisted to the `if (diagramSource)` level — they depend only on
css/html/override.

**Release assertions missed the diagram IR (finding 5).** `scripts/validate.mjs` asserted the packed
tarball carried the showcase `deck.json`, `content.md`, and SVG, but not the diagram IR the
override's regenerability depends on. Added it plus the IR schema.

**IR path containment was bypassable (finding 3).** The path recovered from the CSS marker was
checked with `startsWith("assets/diagrams/")` before joining, so `assets/diagrams/../../x.json`
passed and traversed. Now resolved before the containment test. Read-only impact, but the guard
did not deliver what it advertised.

**Table override was template-bound (finding 4).** `content.md` slide-29 used `.ld-table td`, a
linear-dark class; swiss-modern renders a classless `<table>`, so it silently no-opped inside the
cross-template conformance fixture. Rescoped to `[data-slide-id="slide-29"] td`, present at both
render sites. User confirmed template binding was not intended.

**chartData/images had no shape validation (finding 6).** Both props began rendering in `e74dcfe`;
the runtime checks only Array-ness, so a quoted `value` rendered a NaN-height bar and a typo'd
`src` a broken image, with validate still green. Added
`validate-slide-media-props.mjs` (element shape, unique chart labels, finite values, bundle-relative
and existing image paths, alt-text warning), wired into the v2 validator only — the v1 block stays
frozen. Also fixed `chart-block.tsx` keying bars by label, which collides on duplicates.

Extended to `imageSrc`/`imageAlt` after the fix: `imageSrc` is a scalar `textMeta` prop that flows
straight into `<img src>` in six template files and is used three times in the showcase, so it
carries the identical failure mode and was not covered by the `images[]` guard.

**Test suites were never running in CI (found while fixing).** `engine-ci.yml` ran lint, typecheck,
build:check, validate, and test:smoke — none of the five `engine/cli/tests/*.test.ts` suites, two of
which had no npm script at all. 83 existing tests were unenforced. Added a `npm test` aggregate
script over the glob and wired it into CI.

## Why

Findings 1, 2, 3, and the CI gap are all the same failure class: a green check that does not mean
what it claims. That is worse than a plain bug, because it is the layer you would rely on to catch
the next one.

## Verification

`npm run lint`, `npm run typecheck`, `npm run build:check`, `npm run validate` all green.
`npm test` 95/95 (was 83, none of which ran in CI). Diagram override still matches a fresh render
(scope `aideck-diagram--station-network-796b3878`). Every new test was mutation-checked against the
pre-fix code and fails there.

## Decisions

Two product decisions surfaced by finding 6 were settled with the user and recorded in
`docs/deck-format-spec.md` -> "Decisions (locked)" so they are not relitigated:

- **Remote (`http(s)`) image srcs warn, never fail.** They contradict the self-contained bundle
  principle and break offline/export rendering, so the author is told — but a deck that
  deliberately points at a hosted image stays valid.
- **Shape validation covers `chartData[]`, `images[]`, `imageSrc`/`imageAlt` only.** The other
  rendered array props (`flowSteps`, `commands`, `consequences`, `highlightLines`) fail as empty or
  garbled text rather than a broken render, so they are a known, accepted gap — not a pending task.

## Follow-ups

None open.
