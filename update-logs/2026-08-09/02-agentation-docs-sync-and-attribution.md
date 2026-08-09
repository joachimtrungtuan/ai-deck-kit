# Docs sync + attribution for the Agentation feedback toolbar

**What:** Phase 2 of `plans/260809-1558-agentation-preview-feedback-widget/` — updated
`docs/modules/annotation-module-prd.md` (in-scope preview toolbar, new Runtime surface entry,
dependency on `agentation`) and `docs/system-architecture.md` (Annotation row now mentions
`serve`'s preview-only toolbar). Added a "See it in your browser" line to `README.md` describing
the toolbar and linked a new `THIRD_PARTY_NOTICES.md` from its "For maintainers" section. Created
`THIRD_PARTY_NOTICES.md` at repo root crediting `agentation` (Benji Taylor, © 2026, PolyForm
Shield 1.0.0).

**Why:** Phase 1 mounted the toolbar in code; `annotation-module-prd.md` still said "no UI for
annotation review," which now contradicts actual behavior. The user explicitly asked for clear
attribution if `agentation`'s license calls for it.

**Verified (repo root):**
- `npm run lint && npm run typecheck && npm run validate` — all green.
- `npm run test:serve && npm run test:lifecycle && npm run test:smoke` — all green (25 + 6 tests
  pass; smoke suite does a full clean-install lifecycle including `npm install` of `agentation` as
  a real devDependency, `aideck new`, `serve`-path export builds, PDF export, upgrade, and doctor).

**Plan status:** both phases of `260809-1558-agentation-preview-feedback-widget` are now done.
