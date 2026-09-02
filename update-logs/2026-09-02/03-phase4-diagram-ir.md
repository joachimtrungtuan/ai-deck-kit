# 03 — Phase 4: Diagram IR v1

## What changed

Implemented Phase 4 of plan `260901-1104-motion-unification-showcase-deck-and-diagram-ir`
(Motion Unification, Showcase Deck, and Diagram IR): a full diagram capability —
typed IR, validator, renderer, skill flow, docs, worked example, and export
round trip.

**New**

- `engine/primitives/diagrams/diagram-ir-v1.schema.json` — our own JSON Schema;
  node/edge/group/grid vocabulary adapted from Archify's architecture IR
  (upstream `tt-a1i/archify` @ `06dd052602dd9a369e4d034e24faef0917b5a60c`, read
  2026-09-02, recorded in `$comment`). Spec-only: no Archify code, no dependency.
- `engine/primitives/diagrams/diagram-ir-v1.md` — vocabulary, motion model
  (inherit + diagram presets), and explicit v1 limits.
- `engine/skills/presentation-crafting/scripts/validate-diagram-ir.mjs` —
  dependency-free JSON-Schema-subset checker + semantic pass (id uniqueness,
  edge/group references, grid bounds, one node per cell).
- `engine/skills/presentation-crafting/scripts/render-diagram.mjs` — IR →
  a slide's `override:` YAML block (scoped `css`/`html` + mandatory `reason`).
  Emits only engine `primitive-anim-*`; refuses `morph`; deterministic — scope
  and element ids carry an IR-content hash.
- `engine/skills/presentation-crafting/references/diagram-authoring.md` — the
  deck-work flow (when / author / render / travel).
- `engine/cli/tests/diagram-ir.test.ts` + `npm run test:diagram` — 12 tests.
- Showcase deck: slide `slide-network-diagram` (position 32) +
  `assets/diagrams/station-network.json`; closing renumbered `slide-33`
  (position-derived id rule).

**Modified**

- `validate-slide-content.mjs` — diagram-branch guards (IR exists, hash still
  matches, IR validates, scope class intact, layout/animation "none"). Strictly
  additive; frozen v1 block untouched.
- `engine/preview-app/src/slide-override-layer.tsx` — **defect D4 fix:** the
  override html layer had no `z-index`, so template content (both shipped
  templates cap at 1) painted over it — an "overlay" could never overlay.
  Now `zIndex: 2`. Blast radius: only slides with `override.html`; zero tracked
  decks had one before this phase. Locked by a test.
- `export-standalone-html.mjs` — copies the deck's `assets/` beside the export
  (report §3.9: assets excluded from nothing), so an export re-renders from
  itself. Verified byte-stable round trip. The export folder is no longer
  exactly one file — stated cost of the decision.
- `SKILL.md`, `references/folder-structure.md`, `docs/deck-format-spec.md` —
  diagram flow, storage, and export documentation.

## Why

Phase 4 of the approved plan; every technical choice is a locked decision from
the advisory report + interviews (A4–A7). The renderer emits engine animation
classes only, so one IR animates in each template's idiom purely through
`--deck-motion-*` tokens — proven in real exported runtime under **both**
shipped templates (linear-dark `gentle-rise`; swiss-modern `soft-scale` on a
throwaway probe deck, since removed).

## Verification

- `test:diagram` 12/12; `test:serve` 38/38; `test:lifecycle` 12/12;
  `test:boundary` 12/12; lint; typecheck; build-current.
- Showcase deck validates via `validate-slide-content.mjs`; negative paths
  (stale IR, dangling reference, tampered marker) fail loudly.
- `test:smoke` fails **pre-existing** (fails identically with these changes
  stashed — `create-ai-deck-kit init` cannot install components in this
  environment); not caused by this work.

## Follow-ups

- Phase 5 (promotion tripwire, diagram half) and Phase 6 (contentSchemaVersion
  unification) are unblocked and pending.
- Consider a `--write` mode for the renderer (patch content.md in place) if
  paste-into-fence proves error-prone in real authoring sessions — deferred as
  YAGNI for v1.
- v1 limits recorded in `diagram-ir-v1.md` (no sequence/lane modes, single word
  overflow, marker-keyed tamper checks are opt-out) — extend on evidence.
