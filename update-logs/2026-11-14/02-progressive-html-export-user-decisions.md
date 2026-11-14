# Progressive HTML export — user decisions a–h recorded

**What changed**
- `plans/261114-0021-progressive-html-export/plan.md`: decisions table → resolved; stop list drops font-licence item; phase 07 now FR-70..79, 9h (total ~56h); Validation Log Session 2.
- Phase 01 + 05: 15 MB size gate → reported soft target.
- Phase 07: shared `fsType` reader (`font-license-check.mjs`), wired into `validate-template-manifest.mjs` (FR-78) and `validate-slide-content.mjs` (FR-79); export backstop warn-only (FR-77).
- FR doc: FR-5/AC-1 soft target; FR-15 assets copy web-only; FR-77 warn-only; new FR-78/79; FR-61 cross-origin-only buster note; OQ-2/5/6/10/12 closed; §13 stop list trimmed.
- PRD §7: "self-contained / offline" reworded for single vs web mode and export-time font fetch.

**Why**
User answered a–h. Departures from recommendation: d (soft, not hard 15 MB) and g (licence checked at template/deck authoring, not blocked at export).

**Follow-ups**
- Implementation not started; phase 01 (dedup → 1.4.1) is unblocked.
- Nothing committed.
