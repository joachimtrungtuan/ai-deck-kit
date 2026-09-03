# Phase 5 — Promotion Tripwire (motion-unification plan, 5/6 phases done)

**What:** Wrote the override promotion tripwire into the presentation-crafting skill and applied the user's layered template fix to `linear-dark`.

1. **Skill rule.** New `Override Promotion Tripwire` section in `engine/skills/presentation-crafting/SKILL.md`: threshold = same override *intent* on 3+ slides within one deck (per template set, scoped to the deck in hand; inert `none` overrides count for nothing and should not be written); crossing it produces a **proposal to the user** — never a template edit the agent makes alone, silence is not consent. Explicitly covers layout, animation, and diagram overrides, and is deliberately not a validator check (a failing validator would be the auto-promotion the rule forbids). Checklist line in `references/quality-gate.md`; diagram pointer in `references/diagram-authoring.md`.
2. **Template fix (user decision: both, layered).** Vivimoon's two font-size overrides (below threshold, but same intent across `before-after` + `data-flow`) pointed at a real gap: `.ld-panel .ld-list li` was one step smaller than the general item scale AND outranked the `ld-list-compact-tall-text` class `before-after` already ships (tall text dead in the cascade); `data-flow` mono labels were hard-coded `13px`. Applied: panel items → general scale `clamp(16px,1.3vw,22px)`; new `.ld-panel .ld-list-compact-tall-text li` rule makes before-after tall text effective; `data-flow` primary → `clamp(15px,1.15vw,20px)`, secondary → `clamp(13px,1vw,16px)`. `templateVersion` 3.2.0 → 3.3.0.
3. **Showcase deck:** carries neither override (diagram-generated + one spec-table override only); stays frozen on its 3.2.0 snapshot by design.

**Why:** plan phase 5 — overrides must stop accumulating silently; repeated overrides are a template-gap signal the agent proposes, the user decides.

**Verification:** `npm test` 95/95, lint, typecheck, `npm run validate` (manifest + showcase deck) all green. Typecheck after TSX edits.

**Follow-ups:** Phase 6 (contentSchemaVersion unification) is the last phase. Showcase deck remains on linear-dark 3.2.0 — a re-sync (`aideck deck retemplate`) is a deliberate separate step if the fixture should track 3.3.0.
