# Motion token bridge repair + catalog review fixes

Fixes every finding from `plans/reports/code-review-260901-2315-phase1-2-motion-and-catalog.md`
(review of plan `260901-1104` phases 1–2).

## What changed

**Critical — both shipped templates animated nothing.**
Phase 1 moved animation CSS into the engine but left each template's
`--deck-motion-*` bridge pointing at `--ld-*` / `--swiss-*` tokens the same commit
deleted. An undefined `var()` with no fallback makes the whole `animation`
declaration invalid at computed-value time, so it degrades silently to
`animation: none`. Same defect in the `aideck template new` scaffold, which emitted
a token-less `design-system.css` while its manifest advertised all 10 animations.

Fixed on both sides, deliberately:

- `engine/primitives/blocks/primitives.css` — every token now read through a
  fallback (`--anim-slow` chains to `base` then 760ms, so a two-token template
  keeps its own timing rather than an engine constant).
- `engine/templates/{linear-dark,swiss-modern}.template/design-system.css` —
  timings restored verbatim from the pre-unification `animation-presets.css`
  (`git show 906d355^`): linear-dark 480/700ms + `cubic-bezier(.25,.46,.45,.94)`,
  swiss-modern 520/760ms. The slow tier had been dropped entirely; it is back as
  `--deck-motion-slow`, additive and backward compatible.
- `engine/cli/lib/templates.ts` — new `validateMotionTokens()` runs in
  `validateTemplateBundle`: required tokens present, and no `--deck-motion-*`
  pointing at a `var()` nothing in the bundle defines. Mirrored in the
  template-creation skill validator. The scaffold now seeds the three tokens.

**Other findings.**

- `line-draw` was a no-op wherever it was applied to a `<div>` frame
  (`visual-led-slides.tsx:77`, `technical-slides.tsx:58`) — `stroke-*` renders only
  on SVG geometry. Now paired with an opacity entrance. Strictly additive; no
  descendant selector, so Phosphor icon rendering is untouched.
- Reduced-motion guard missed `staggered-list` children and left `line-draw` on an
  undrawn (invisible) stroke. Both covered.
- `validate-slide-content.mjs` — animation check no longer throws on a non-string
  `animation`; the morph-anchor rule is now enforced on content schema v2, not
  just v1 (v2 anchors collected recursively, mirroring the runtime parser).
- `element-animation-catalog-v1.md` — new "Motion tokens" section: the three
  tokens, their fallbacks, required vs optional, the invalid-at-computed-value-time
  trap, and the `pathLength="1"` requirement for `line-draw`.
- `templateVersion` bumped: swiss-modern 3.1.0 → 3.2.0, linear-dark 3.0.0 → 3.1.0.

## Verification

- Full CLI suite 66/66 (was 64; two new tests). Six synthetic fixtures that
  hand-built token-less templates were updated to declare tokens — the fixtures
  were wrong, the new check is not.
- New tests lock both regressions: the scaffold must emit tokens, and
  `validateMotionTokens` must reject the missing-token *and* dangling-reference
  cases (including a definition living in a sibling stylesheet).
- Browser probe of `serve template linear-dark`: tokens resolve to 480ms / 700ms /
  the template's own easing; `gentle-rise` runs `primitiveRise` at 0.48s (was
  `none`); `masked-reveal`, `spotlight` at 0.7s; `line-draw` carries
  `primitiveLineDraw, primitiveFade`; staggered children step 0/72/144/216ms.
- `typecheck`, `validate`, `git diff --check` clean.

## Follow-ups

- `npm run build:check` compares `engine/cli/dist` against git, so it stays red
  until `engine/cli/dist/lib/templates.js` is committed with the source. Rebuild
  is done; the commit is not (no commit requested).
- Reduced-motion behaviour verified by reading the CSS, not in a browser — the
  preview iframe can't emulate `prefers-reduced-motion`.
