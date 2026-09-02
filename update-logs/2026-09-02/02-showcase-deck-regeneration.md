# 02 — Showcase deck regeneration (plan 260901-1104, Phase 3)

## What changed

- **New conformance fixture:** `engine/examples/showcase.deck/` — 32 slides of
  newly written, brand-free community-weather-network copy covering all 30 v2
  slide types, all 9 transitions, all 10 merged element animations, and a real
  `morph` pair (chart 15 ↔ metric 16, anchor `rainfall-trend`; slide 16 also
  carries `crossfade` so morph-wins-over-transition is exercised). Pinned to
  linear-dark 3.2.0. One genuine override (`spec-table` css tabular-nums, real
  reason); zero inert override blocks.
- **`decks/vivimoon-website.deck/` removed** (staged to temp:
  `…/T/opencode/vivimoon-website.deck.removed-2026-09-02` — `rm -rf` is blocked
  by local policy). `vite.export.config.ts` no longer defaults to
  `vivimoon-website` (it would have silently exported a deleted deck); deck id
  now derives from `AIDECK_DECK_PATH` or fails fast. `serve.test.ts` slug strings
  repointed. No tracked references remain.
- **Template fixes the fixture surfaced** (user-approved in-phase; the vivimoon
  deck had all motion off and used neither `chart` nor `image-grid`, so these
  had never rendered):
  - D1: `chart` rendered a literal "Chart component slot" placeholder in both
    templates → both now consume `chartData` via primitives `ChartBlock`.
  - D2: `image-grid` rendered empty frames → both now consume `images[]`
    (`{src, alt, caption}`), `items[]` fallback kept.
  - D3 (linear-dark only): `.ld-metric` `letter-spacing: -0.03em` inherited into
    the stat-label span as absolute −3.7px (label rendered as overlapping
    glyphs) → label set `letter-spacing: normal`; linear-dark also gained the
    full `base-token-contract.md` `--deck-*` alias mapping (it had bridged only
    motion — the new chart was invisible without color/radius/space aliases).
  - Bumps: linear-dark 3.1.0→3.2.0, swiss-modern 3.2.0→3.3.0. `template-system.md`
    version table corrected (it had drifted stale).
- **`.gitignore`:** re-include for the showcase bundle's assets — the global
  `assets/` rule would otherwise have violated the locked asset policy (nothing
  under a bundle's `assets/` is ignored). Verified with `git check-ignore -v`;
  all 24 bundle files trackable, 6 assets included.
- **Fixture adoption:** `scripts/validate.mjs` (CI `npm run validate`) now runs
  the canonical deck validator against `engine/examples/showcase.deck` and the
  release-packaging assertions require its `deck.json`, `content.md`, and an
  asset.

## Why

Phase 3 of the active plan: replace the client deck with a generic, publicly
shippable showcase that doubles as the repo's conformance fixture, so
"did we break anything?" has one answer — render the showcase deck.
See `plans/260901-1104-motion-unification-showcase-deck-and-diagram-ir/phase-03-showcase-deck-regeneration.md`
→ Execution Record for deviations (v2 decks cannot consume block-level animation;
per-slide animation values had to be written into `deck.json` because no CLI
command sets them).

## Verification

`aideck validate` ✓ · `npm run validate` ✓ · lint / typecheck / build:check ✓ ·
test:serve 38 pass · test:lifecycle 12 pass · test:boundary 12 pass · full 32-slide
render walk on linear-dark and swiss-modern, 0 console errors · standalone HTML
export from the relocated bundle verified self-contained.

## Follow-ups

- `aideck init` should copy `engine/examples/` into a new workspace's `decks/`
  (report §3.5 anticipated this; installer slice, not this phase's files).
- CLI gap: no command sets an arbitrary per-slide animation (`anim toggle` is
  default↔none only) — worth a small `aideck anim set <id> <name>`.
- v2 validator has no block-level animation rule (moot while v2 layouts ignore
  `blocks[]`).
- Purge the temp-staged vivimoon copy whenever convenient.
