# Progressive HTML export — requirements, plan, validation

**What changed**
- Decisions brief (user-confirmed, from advise session): `plans/reports/advise-261114-0021-progressive-html-export-decisions.md`.
- New FR doc: `docs/modules/export-progressive-html-functional-requirements.md` (FR-1..84, AC-1..10, OQ-1..12); pointer added in `docs/modules/export-package-module-prd.md` and `docs/modules/README.md`.
- Plan: `plans/261114-0021-progressive-html-export/` — 9 phases, ~54h. 01 asset dedup → 1.4.1 alone; 02 spikes gate 03–08; 09 docs + 1.5.0 release.
- Validation (independent subagent): READY WITH FIXES, 5 small plan edits. Report: `plans/261114-0021-progressive-html-export/reports/validate-261114-plan-readiness.md`.

**Why**
HTML export is ~29.5 MB for a 40-slide deck (images embedded twice) and renders nothing until fully downloaded. Goal: dedup, progressive loader, single/web modes, CSP hardening.

**Follow-ups**
- User decisions a–h in `plan.md` (d, e block phase 01; others block 03–09). PRD §7 wording not yet amended (decision a).
- Script placement: post-build step must move the inline app script after `#root` (non-module) before CSP hashing; proven in spikes S1/S7.
- Marusei ≤15 MB is tight (~13.3 MB base64 assets + JS/CSS).
- Nothing committed.
