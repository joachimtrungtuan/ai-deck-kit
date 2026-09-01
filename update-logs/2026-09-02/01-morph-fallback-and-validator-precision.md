# Morph transition fallback, narrower reduced-motion, sharper token validator

**Date:** 2026-09-02
**Trigger:** re-review of the motion token bridge repair — `plans/reports/code-review-260902-0020-motion-repair-reverify.md`

## What changed

**`engine/primitives/motion/morph-anchor-resolver.ts`** — the morph clone built its `transition` from
`var(--deck-motion-ease)` with no fallback, then appended itself to `document.body`. Custom
properties inherit downward and the deck class sits on a `<div>`, so the clone could never see the
token: the whole declaration was invalid at computed-value time and morph snapped instead of
tweening. The ease is now read off the source element (which *is* inside the deck) and inlined as a
literal, so the template's own easing is honoured rather than a blind fallback.

**`engine/primitives/blocks/primitives.css`**
- `--anim-base/slow/ease` → `--deck-anim-base/slow/ease`. They sat unprefixed in the global custom-property namespace of a public API surface.
- The reduced-motion rule no longer applies `clip-path: none` / `transform: none` to every direct child of every animated element. Only staggered-list children animate, so they get their own narrow `animation: none`.

**Both token validators** (`engine/cli/lib/templates.ts`, `engine/skills/presentation-template-creation/scripts/validate-template-manifest.mjs`) — `var(--a, var(--b))` no longer reports `--b` as dangling when `--a` is defined; the fallback is only reached when `--a` is not. A literal fallback anywhere in the chain also resolves the declaration. The textual-check limitation (a token defined under a selector the deck never matches, or inside `@media print`, still reads as defined) is now stated in both doc comments rather than left implicit.

**Docs** — `base-token-contract.md` lists the optional `--deck-motion-slow` tier; `template-system-and-versioning.md` no longer calls `animation-presets.css` "optional" (no template ships one) and names the slow tier.

## Why it was invisible

Same root cause as the two Criticals this repair chain started from: an undefined `var()` with no
fallback silently invalidates its whole declaration. Nothing logs it. The morph case survived the
first fix because it builds its transition in JS, not CSS, so a grep of the stylesheets missed it.

## Verification

- Browser, `/primitives`: morph clone now computes `transform, opacity / 0.52s, 0.52s / cubic-bezier(0.22, 1, 0.36, 1)` (was `all / 0s / ease`). `gentle-rise` runs `primitiveRise` at 520ms with the template's own easing — the renamed aliases resolve to swiss-modern's values, not the engine fallbacks.
- Reduced-motion rules in the CSSOM are exactly the parent reset plus `.primitive-anim-staggered-list > * { animation: none }`.
- `npm run lint`, `npm run typecheck`, `npm run validate` clean. CLI suite **67/67 pass, 0 fail** (new validator-parity test).

## Follow-ups

- `engine/preview-app/src/export-shell.css:140,168` still carry `[class*="ld-anim"]` selectors. No template emits that class since the animation unification — dead, harmless, left in place rather than deleted alongside an unrelated change.
- The skill's standalone `.mjs` validator is deliberately dependency-free, so its motion check stays a copy of the CLI's. A parity test now fails if the two drift.
