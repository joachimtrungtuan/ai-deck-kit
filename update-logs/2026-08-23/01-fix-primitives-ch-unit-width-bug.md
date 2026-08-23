# Fix engine-level `ch`-unit width bug in title-description primitive

**What:** `engine/primitives/blocks/primitives.css`'s `.primitive-title-description p` rule used `max-width: 60ch`. Chromium fails to resolve `ch` units against `@font-face` fonts loaded via `data:`/`blob:` URIs inside an iframe (the export runtime's rendering context) and silently falls back to a `0.5em`-per-character heuristic — while the same rule resolves correctly against network (`http://`)-sourced fonts (the preview app's rendering context). This produces a Preview-vs-HTML-export width mismatch for any consuming template that doesn't override the rule.

Same defect class already found and fixed at the template level in a separate project (AI Udemy Course's `clarity-courseware.template`, `components.css` + `layouts.css`, bumped to templateVersion 1.19.3). This was the third instance of the same bug — this time in genuinely engine-shared code, confirmed identical in both this repo and the installing project's copy — so it belongs here rather than in any one template.

**Why:** `60ch` was the only `ch`-unit declaration in the entire file (everything else uses `rem`/`clamp()`), and — unlike a single-template fix — this primitive is consumed by templates with arbitrary `--deck-font-body` stacks, so a font-specific empirical px measurement wouldn't generalize. Converted using the same `ch ≈ 0.5em` convention Chromium's own broken fallback already uses (60ch × 0.5em × 16px font-size = 480px = 30rem), which matches the file's existing rem-based convention and stays font-agnostic.

**Fix:** `max-width: 60ch` → `max-width: 30rem` in `engine/primitives/blocks/primitives.css:19`.

**Scope check:** confirmed both shipped templates (`linear-dark`, `swiss-modern`) already override this rule with their own higher-specificity selectors (`.ld-rule-top .ld-template-title-block p`, `.swiss-rule-top .swiss-template-title-block p`, both `62ch` — same bug class, but out of scope for an engine-repo fix since they're template-owned). So this fix is currently inert for both shipped templates and changes no currently-rendered deck; it closes the gap for any template that consumes `TitleDescriptionBlock` without its own override. Verified visually + via `getComputedStyle` on the `/primitives` demo route (`engine/preview-app/src/primitives-demo.tsx`), which renders the primitive unshadowed — confirmed `maxWidth: "480px"`, no layout breakage.

**Version bump:** `engineVersion`/`version` 0.3.2 → 0.3.3 in `ai-deck-kit.json`, `engine/engine.version.json`, `package.json`, `engine/package.json` (lockstep, per existing convention).

## Follow-ups

- The Udemy project's installed `engine/` copy is a separate, already-installed snapshot — this fix does not propagate there automatically. Whether/how to push this to that project (an engine upgrade operation on the installing project's own files) was not performed here since it wasn't authorized as part of this task.
- Still-open cleanup decision (unrelated, carried over from an earlier session): this repo's temporary repro fixtures — `decks/repro-ch-unit-bug.deck/`, a `templates/clarity-courseware.template/` copy, and the `.claude/launch.json` `repro-ch-unit-bug-preview` entry — created to diagnose the original bug report. Not addressed this session.
