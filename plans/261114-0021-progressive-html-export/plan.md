---
title: "Progressive HTML export: asset dedup, single/web modes, loader, CSP"
description: "Dedup embedded assets (own release), then add --mode single|web, progressive loader + gate, strict meta CSP, source scan and headless CSP check."
status: completed
priority: P1
effort: 56h
branch: feat/progressive-html-export
tags: [export, html, csp, performance, release]
created: 2026-11-14
---

# Progressive HTML Export

Spec: `docs/modules/export-progressive-html-functional-requirements.md` (FR/AC/OQ IDs below).
Decisions (closed; do not reopen): `plans/reports/advise-261114-0021-progressive-html-export-decisions.md`.

## Phases

| # | Phase | Covers | Effort | Status |
|---|-------|--------|--------|--------|
| 01 | [Asset dedup + patch release](phase-01-asset-dedup-and-patch-release.md) | FR-1..6, AC-1, AC-2 | 8h | completed |
| 02 | [Spikes S1-S7](phase-02-browser-and-csp-spikes.md) | OQ-1,3,4,7,8,9,11,12 | 6h | completed |
| 03 | [`--mode` flag + output assembly](phase-03-export-mode-flag-and-output-assembly.md) | FR-10..15, AC-5, AC-6 | 4h | completed |
| 04 | [Asset loader, loader UI, slide gate](phase-04-asset-loader-and-slide-gate.md) | FR-20..26, AC-3, AC-4 | 8h | completed |
| 05 | [Per-mode delivery](phase-05-single-data-blocks-and-web-preload.md) | FR-30..33, FR-40..42 | 7h | completed |
| 06 | [Meta CSP + hardening](phase-06-meta-csp-referrer-and-frame-busting.md) | FR-50..52, FR-60..63, AC-7 | 6h | completed |
| 07 | [Source scan + Google Fonts embed](phase-07-external-source-scan-and-font-embedding.md) | FR-70..79, AC-8 | 9h | completed |
| 08 | [Headless CSP check](phase-08-headless-csp-check.md) | FR-80..84, AC-9, AC-10 | 5h | completed |
| 09 | [Docs, changelog, minor release](phase-09-docs-changelog-and-minor-release.md) | all; PRD §7 | 3h | completed |

Dependencies: 01 ships alone (1.4.1). 02 gates 03-08. 03 -> 04 -> 05 -> 06 -> 07 -> 08 -> 09 (1.5.0).

## Acceptance (whole plan)

- AC-1..AC-10 pass; each phase lists its own checks.
- Every phase: `npm test`, `npm run build:check`, `npm run lint`, `npm run typecheck`, `npm run validate` green.
- Marusei deck (outside repo) verified by hand for AC-1/2/3/4/10; results recorded in the update log.

## User decisions (resolved 2026-11-14)

| Item | Question | Decision | Phases |
|------|----------|----------|--------|
| a | PRD §7 "self-contained / runs without network" vs web mode + export-time font fetch | Amend §7: single mode = one self-contained file; web mode = folder; export may fetch fonts once at build; the page itself never makes network requests. | 03, 07, 09 |
| b | `connect-src` (OQ-5) | `'none'` | 06 |
| c | Single mode keeps `assets/` copy? (OQ-2, FR-15) | Copy only in web mode | 03 |
| d | 15 MB hard limit or target? (OQ-6) | **Soft target.** Export reports the size; Marusei slightly over does not block a release. | 01, 05 |
| e | Embed referenced assets only, or all of `assets/`? (OQ-10) | Referenced only | 01 |
| f | Web-mode app script inline or external? (OQ-12) | Inline + hash, same build both modes | 03, 06 |
| g | Where is font licence checked? (FR-77) | **At authoring time**: template validator and deck validator check font licences (FR-78, FR-79). Export keeps a warn-only `fsType` backstop and still embeds. | 07 |
| h | Presenter frames the export (`mirror-frame.tsx:85`) and injects a `<style>` | Buster acts only when framed cross-origin; injected style replaced by an attribute selector shipped in the hashed CSS | 06 |

Conditional stop-and-ask (spec §13), raised by phases when hit: S1 progressive parse fails (02), template paths unresolvable (01/02), strict `style-src` breaks a template (02/06), unclassifiable source or template needing an external origin (07).

## Notes

- Engine-only work; nothing deck-specific in the engine. One shared preview runtime.
- No plan/finding IDs in code, test names, or commits. No AI references in commits.
- Releases: lockstep version bump, changelog, annotated tag on `main`, Engine Release workflow creates the release (never `gh release create`), then `gh release edit` notes, then update log.
- nginx gzip of large base64 is unverified and informational only; not gating.

## Validation Log

### Session 1 — 2026-11-14 (independent validate, no user interview)
- Traceability: all 56 FR, 10 AC, 12 OQ IDs in the spec are cited by a phase; no orphan IDs.
- Code refs verified: plugin L278/L310/L344, canvas L73/L119, `PrintDeck` L161, `authoringSlideYamlKeys` L36, `output.ts` L143-148, `findChrome` L37, `mirror-frame.tsx` L80/L85, `serve.test.ts` path, `export.html`, workflow gates.
- Edits: phase 01 (generated-source scope wording, plugin-size split, full release steps); phase 03 (IIFE placement post-build gap).
- Open: decisions a-h (closed in Session 2). Report: `reports/validate-261114-plan-readiness.md`.

### Session 2 — 2026-11-14 (user decisions a–h)
- All eight answered; table above. Two differ from the recommendation: d (soft target, not hard limit) and g (licence check moves to template/deck validators; export warn-only).
- Edits: phase 01 + 05 size gate → reported soft target; phase 07 adds shared `fsType` reader, validator checks, warn-only export; spec FR-5, FR-15, FR-77, AC-1, new FR-78/79, OQ-2/5/6/10/12 closed; stop list drops the font-licence and `assets/` items; PRD §7 amended.

### Final closure — 2026-11-15
- User explicitly chose **“Keep releases local”**. GitHub publication is intentionally deferred outside current delivery, not awaiting approval. Original publication procedures remain available for future use.
- All nine phases complete; implementation, docs, local annotated v1.4.1/v1.5.0 releases, actual package/install/upgrade verification accepted. No external push, workflow, hosted assets or release-note edits claimed.
- Active checklist: 56/56 (100%); publication tasks moved to explicit non-checkbox deferred records rather than falsely checked.
- Source `15b453c`: 228/228 tests and all five gates passed; post-bump checks and final local audit approved. AC-1..10 accepted, preserving reported soft-size miss and slide-35 equivalent gate.
- [Final status](reports/final-plan-status.md), [local release verification](reports/local-release-verification.md), [local review](reports/review-local-release.md). Registry-backed clean installation remains unverified; actual packed install/upgrade passed.
