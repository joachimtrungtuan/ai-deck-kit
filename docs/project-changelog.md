# AI Deck Kit — Project Changelog

## 1.5.2 — 2026-11-15

- **HTML exports render with their deck styling again.** Since 1.5.0 the
  export moves its inlined stylesheet into `<body>` so the loader paints
  first, but the slide iframe cloned styles only from `<head>`. Slides in
  `--mode single` and `--mode web` therefore rendered unstyled. The iframe
  now clones every stylesheet in the document.
- **The export toolbar lays out correctly.** The button-based slide picker
  (1.5.0) inherited the 32×32 sizing of the prev/next arrows, so its label
  wrapped inside a tiny box and collapsed the toolbar. The picker now sizes
  to its label on one line (capped at 200px with an ellipsis), and the menu
  width is capped.
- **Security updates for engine dependencies.** `vite` ^7.3.8 fixes
  high-severity dev-server advisories. `storybook` / `@storybook/react-vite`
  ^10.6.7 (dev) fixes a critical dev-server code-injection advisory. In-range
  and transitive updates are included too. The 4 remaining moderate advisories
  are dev-only (`glob`/`minimatch` via the Storybook docgen plugin).

## 1.5.1 — 2026-11-15

- **Large exports pass the CSP check.** The headless check streams Chrome's
  DOM dump to a file instead of a 32 MB pipe buffer, so single-file exports
  with many embedded images no longer fail with `ENOBUFS`. PDF export's
  capture pass uses the same file-based dump (it had a 64 MB pipe cap).
- Includes the codebase-review fixes merged after 1.5.0: failed startup
  assets no longer block deck loading, Google Fonts are embedded across all
  style blocks, remote fonts in `override.css` are rejected, and the Vite deck
  plugin is split into focused modules.

## 1.5.0 — 2026-11-15

- **Progressive HTML startup.** HTML export now prioritizes the first four slides,
  gates until their images are loaded and decoded, and re-prioritizes after a
  jump to a later slide.
- **Two delivery modes.** `aideck export html <deck> --mode single|web` keeps
  single-file output as the default and adds a static web folder containing
  `index.html` plus only referenced assets.
- **Hardened exported pages.** Source scanning, Google Fonts embedding, hashed
  scripts/styles, strict CSP, referrer protection, frame refusal, and the
  headless CSP check now share one export pipeline.
- **CSP-safe navigation.** The exported slide picker uses an accessible custom
  listbox so native-browser inline-style violations do not require a policy
  relaxation.
- **Docs.** Updated the export PRD, functional requirements, architecture,
  presentation-crafting skill, README, and release evidence. Publishing remains
  approval-pending.

## 1.4.1 — 2026-11-14

- Standalone HTML export embeds each referenced image once. Slide props keep
  plain `assets/` paths; the build adds one shared table of data URIs and a
  runtime resolver swaps them in per slide, instead of copying the image for
  every use. A 40-slide reference deck exports at 15.8 MB instead of 29.5 MB.
- Only assets referenced by rendered slide props are embedded. Authoring-only
  keys (`assets:` lists) and speaker notes no longer add anything to the file.
- The export build fails on a missing asset and on an asset that escapes the
  deck folder, whether through `../` or a symlink inside `assets/`.
- Legacy v1 slide fences that are not valid YAML still keep their images, and
  prose such as "assets/ is where images live" is not read as an asset path.
- Docs: progressive HTML export functional requirements
  (`docs/modules/export-progressive-html-functional-requirements.md`) and the
  recorded product decisions; the export module PRD now separates single-file
  and web-mode offline claims.

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
