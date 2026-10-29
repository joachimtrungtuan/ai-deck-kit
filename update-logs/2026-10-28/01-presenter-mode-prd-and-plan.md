# Presenter mode: PRD + plan

- **What:** Branch `feat/presenter-mode`. Added `docs/modules/presenter-module-prd.md` (decisions D1–D7, requirements R1–R17) and the plan `plans/261028-2131-presenter-mode/` (3 phases; decisions resolved). No engine code changed.
- **Why:** The user wants a built-in presenter mode to replace the ad-hoc Bodor presenter. That presenter wraps the export in an iframe and drives it by poking its DOM. The scope was settled in an advisory interview.
- **Follow-ups:** The user validates the plan, then the build starts. The open questions are resolved.

- **Validation (Session 1, 2026-10-28):** plan verified against code and revised per user answers (node:test + manual checklist, `force` nav bypass, react-markdown stack, `/@fs` export iframe, query-param mode, single splitter). See `## Validation Log` in `plans/261028-2131-presenter-mode/plan.md`.
