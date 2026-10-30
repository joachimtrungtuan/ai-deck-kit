# AI Deck Kit — Project Changelog

## 1.4.0 — 2026-10-30

- Presenter layout: a draggable splitter between the slides and notes columns
  (with minimum widths), the view fills the viewport under the view switcher,
  and slide frames fit inside their column.
- Presenter shows the previous, current and next slides; only the current slide
  animates, the previous and next previews are still images.
- Live mirror frames now play slide transitions.
- Slide title and progress are shown more prominently.
- Bottom bar in two rows: the talk clock shows seconds and gains ±5m and ±10m
  steps; the go-to control takes a slide number or a slide picked by name.
- Notes text size buttons; the size applies to all slides and is kept until
  the dev server stops.

## 1.3.0 — 2026-10-29

- Added presenter mode: `aideck present <deck> [--export]` opens a presenter
  window (current/next slide, HTML notes, talk clock, per-slide timers,
  rehearsal log) synced over `BroadcastChannel` to an audience window.
- Content schema `3.2.0`: optional `Pacing`, `Target` and `Cue` header lines in
  `### Speaker Notes`; unknown values are validator warnings.
- Exports now strip `### Speaker Notes`; a stale-export banner appears when the
  frozen export no longer matches the live deck.
- Preview sidebar gains a "Present" link.

## 1.1.0 – 1.2.0 — never released on their own; first shipped in v1.3.0

- 1.2.0 — content schema `3.1.0`: optional slide `tocTitle` (shown in the
  preview slide list and export picker) and `tableColumnWidths` (applied by the
  shipped table layouts).
- 1.1.x — slide field editor in the preview with a YAML write path back to
  `content.md` that keeps authored formatting and line wrapping.
- Installer and upgrade hardening: recovery after interrupted installs,
  stricter argument parsing, hook wiring checks, a committed engine lockfile,
  and a release check that the compiled CLI entry points ship in the package.
- Content schema `3.0.0` unified across engine, templates and the showcase deck;
  diagram IR v1; shipped showcase deck as the conformance fixture; motion token
  and template rendering fixes.

## 1.0.0 — 2026-08-28

- Added dual-schema `content.md` parsing and validation: existing v1 decks stay
  unchanged, while new decks from the shipped templates use canonical v2.
- Migrated shipped Linear Dark and Swiss Modern templates to v2 `items[]`
  content and retained v1 support for existing decks.
- Upgrading does not migrate user content or project-local templates.
- Added deterministic three-level schema guidance planting plus
  `aideck guidance status|sync`; doctor reports missing/stale legacy guidance,
  while creation, retemplate, and template-version operations refresh it.

## 2026-08-08

- Removed the `clarity-courseware` template (bundle, catalog doc, registry entries) from this repo; it now lives as a project template in the target project it serves.

## 2026-07-25

- Added the shipped `clarity-courseware` template: a compact 10-type courseware profile with 25 curated layout variants and white, orange, and black background modes.
- Added original course imagery, Inter/Newsreader mixed-heading support, course headers, section/page footers, and restrained motion.
- Generalized manifest-backed `.deck` preview resolution so embedded bundles are
  preferred, installed `<name>.template` bundles are the fallback, and each
  bundle supplies its own layout components and deck class without template-name
  branches; embedded name/version identity is validated.
- Added layout/background variant validation to template and deck contracts, focused CLI tests, and fixed-canvas/export support for the new template.
- Fixed portable-install standalone exports so direct slugs honor the workspace `decksRoot` and HTML/PDF output stays beside the selected `.deck` bundle.

## 2026-07-23

- Added root distribution entrypoint and root/subfolder installer flow.
- Added atomic engine-only upgrade with doctor verification and deck-tree hash smoke test.
- Added GitHub Actions CI/release workflows and deployment/upgrade documentation.
- Migrated shipped template helpers to shared primitive block compositions and base-token aliases.
- Added nested-workspace validation and HTML/PDF export coverage for Swiss Modern and Linear Dark.
- Verification note: local lint, typecheck, validators, source-fixture smoke, exports, and package dry-run passed; registry-backed clean install remains blocked by npm DNS `ENOTFOUND`, and no remote release is claimed.
