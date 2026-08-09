# Mount Agentation feedback toolbar in shared preview app

**What:** Added `agentation` (v3.0.2) as a devDependency of `engine/package.json` and mounted
`<Agentation />` as a sibling of `<AppRouter />` in `engine/preview-app/src/main.tsx`'s single
`createRoot(...).render()` call. Added a test in `engine/cli/tests/serve.test.ts` asserting the
import/mount exist in `main.tsx` and are absent from `export-main.tsx`.

**Why:** `aideck serve` had no way to leave feedback on a rendered slide. `agentation` provides
click-to-annotate + copy-to-clipboard out of the box; mounting it once at the shared preview entry
covers deck preview, template preview, and the template gallery with zero target-specific logic.

**Verified:**
- `npm run typecheck` clean.
- `aideck serve <deck>` and `aideck serve --template swiss-modern` both show the toolbar; feedback
  mode activates and the picker UI renders.
- `aideck export html vivimoon-website` output has zero occurrences of "agentation" (grep -ic = 0).
- `engine/cli/tests/serve.test.ts` — all 25 tests pass, including the new mount assertion.

**Follow-ups:** Phase 2 of `plans/260809-1558-agentation-preview-feedback-widget/` — docs sync
(`annotation-module-prd.md`, `system-architecture.md`, `README.md`) and creating
`THIRD_PARTY_NOTICES.md` crediting Agentation/Benji Taylor/PolyForm Shield 1.0.0 — still pending.
