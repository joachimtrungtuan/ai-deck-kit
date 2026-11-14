---
module: "export-package"
document: "functional-requirements"
feature: "progressive-deduplicated-csp-html-export"
surface: ["cli", "runtime"]
status: "draft"
version: "0.1.0"
depends_on: ["presentation", "preview"]
---

# Functional Requirements: Progressive, De-duplicated, CSP-hardened HTML Export

> Sub-specification of [export-package-module-prd.md](./export-package-module-prd.md).
> Requirements IDs (`FR-n`) are stable and cited by acceptance criteria (section 6).
> Code owns the implementation; this document owns the WHY, the required behavior, and
> the decisions that are not yet made. Where a requirement names a directive, origin, or
> flag, that value is the contract, not a description of today's code.

## 1. Purpose and Why

`aideck export html` currently writes one `index.html` that inlines every deck image as a
base64 data URI inside a single JavaScript module. Nothing renders until the whole file has
downloaded, and each image is typically embedded more than once. A 40-slide deck exported to
29.5 MB while its `assets/` folder holds 10 MB.

This feature fixes four problems together:

- **Size:** each image is embedded at most once.
- **Time to first slide:** the deck appears and becomes navigable before all assets arrive.
- **Hosting:** a web mode produces a folder that needs no per-deck server configuration.
- **Trust:** the exported page carries a strict Content Security Policy (CSP) and is verified
  against it at export time.

## 2. Terms

| Term | Meaning |
|------|---------|
| Single mode | `--mode single` (default). One HTML file; opens over `file://`. |
| Web mode | `--mode web`. A folder (`index.html` + `assets/`) for a static host. Also opens over `file://`. |
| Slide asset table | One map from deck-relative path (`assets/<file>`) to its payload, shared by all slides. |
| Data block | `<script type="text/plain" data-slide="N">` carrying one slide's asset payload in single mode. |
| Gate | The loader state that holds a slide back until its own assets are loaded and decoded. |
| Allowance | One origin or keyword added to a CSP directive because a deck or template source needs it. |

## 3. Asset De-duplication (ships first, as its own release)

Why: this change alone removes most of the size problem, carries no CSP or mode risk, and
gives a clean baseline to measure the rest against. It ships before the modes and CSP work.

- **FR-1** Each distinct asset file is embedded at most once in a single-mode export.
  Verify by counting occurrences of each payload in `index.html`.
- **FR-2** Asset payloads live in one shared slide asset table keyed by deck-relative path.
  Slide content keeps plain `assets/` paths and resolves them at render time. Owner:
  `engine/preview-app/vite-deck-plugin.ts` (`inlineDeckAssets`).
- **FR-3** The asset list for each slide is derived from that slide's render props (the image
  and logo sources its layout actually reads). It is not taken from the authoring-only
  `assets:` frontmatter key. Why: `assets:` is an authoring hint, never rendered, and listing
  it as a second source is the duplication cause. Owner:
  `engine/preview-app/src/content-schema-v2.tsx` (`authoringSlideYamlKeys`).
- **FR-4** Asset paths that do not resolve to a file under the deck's `assets/` fail the export
  with an error that names the path. Existing behavior; must not regress.
- **FR-5** The Marusei reference deck (40 slides) targets a single file of about 15 MB. This is a
  soft target: the export reports the size, and a slight overshoot does not block a release.
- **FR-6** After FR-1 to FR-5, PDF export (`engine/skills/presentation-crafting/scripts/export-pdf.mjs`)
  still captures every image of every slide. This is a regression gate for the release.

## 4. Export Modes

- **FR-10** `aideck export html` accepts `--mode single|web`. Default is `single`. Any other
  value fails with a non-zero exit and a message listing the valid values. Owner:
  `engine/cli/commands/output.ts` (`runExport`), which drives
  `engine/skills/presentation-crafting/scripts/export-standalone-html.mjs`.
- **FR-11** Single mode writes one HTML file, named `index.html` as today. All app code, styles,
  and slide data are in that file (see section 5). It must render over `file://` with no
  server.
- **FR-12** Web mode writes `index.html` plus an `assets/` folder. Asset references are plain
  relative paths. Images are not inlined. The folder is complete as a static site root: upload
  it and no per-deck server configuration is needed.
- **FR-13** Both modes open by double-click over `file://` and render the first slides.
- **FR-14** Neither mode issues `fetch()` or XHR for deck content. Web mode preloads with
  `Image()` (section 6). Why: `fetch()` fails on `file://` in Chrome.
- **FR-15** Only web mode copies `assets/` next to the HTML. Single mode writes the HTML file
  alone.

## 5. Loader and Gate Behavior (both modes)

- **FR-20** The loader appears immediately on open, before any slide image is ready. Its progress
  bar counts only the assets of slides 1 to 4.
- **FR-21** The deck starts only when every image of slides 1 to 4 has loaded and its
  `decode()` has resolved.
- **FR-22** Remaining slide assets load in background in slide order, beginning after slide 4.
- **FR-23** Navigating to a slide whose assets are not all ready shows the gate on that slide.
  The slide does not render until its assets are ready. Navigation is not otherwise blocked.
- **FR-24** On a jump, background loading re-prioritises from the target slide: the target and
  the following slides first, then the remaining slides in order.
- **FR-25** Assets that are already loaded are not requested again on a jump.
- **FR-26** Under a throttled connection, the loader is visible within about one second of open
  (success metric SM-2).

Why the gate is per slide and not global: a reader who jumps to slide 38 should see progress,
then the slide, not wait for the whole deck.

## 6. Delivery

### 6.1 Single mode (per-slide data blocks)

- **FR-30** Each slide's asset payloads are placed in a `<script type="text/plain" data-slide="N">`
  block. Blocks follow the app script. Because the blocks are not executed, they need no CSP hash.
- **FR-31** The app reads data blocks as they arrive. Slides 1 to 4 must not wait for the last
  block to be parsed. Browser coverage is recorded in the phase reports.
- **FR-32** A data block carries asset payloads only, keyed by path. It contains no executable
  content.
- **FR-33** Payload text is escaped so it cannot close its enclosing script element. The
  serializer must never emit the closing-tag sequence inside a block.

### 6.2 Web mode (plain paths, preload with Image)

- **FR-40** Web mode does not inline assets into `index.html`. Slide content references the
  `assets/` paths directly.
- **FR-41** Preloading uses `new Image()` followed by `img.decode()`. No `fetch`, XHR, or
  `<link rel="preload">` is used for deck content. The gate rules (section 5) apply unchanged.
- **FR-42** Web mode's `img-src` includes `'self'` (section 7.3) so that the `assets/` paths load
  under the policy. Single mode uses data URLs; web mode uses adjacent same-origin assets.

## 7. Content Security Policy and Page Hardening

### 7.1 Meta policy

- **FR-50** Every exported `index.html`, in both modes, carries a
  `<meta http-equiv="Content-Security-Policy">`. The policy is emitted at build time from the
  template shell `engine/preview-app/export.html` (which has no CSP today).
- **FR-51** Directives are set as below. Each is the default unless an allowance from section 8
  adds an origin.

| Directive | Value (single mode) | Value (web mode) | Rule |
|-----------|---------------------|------------------|------|
| `default-src` | `'none'` | `'none'` | Everything not listed is denied. |
| `script-src` | `'sha256-<app script>'` | `'sha256-<app script>'` | Hash computed from the emitted app script. No `'unsafe-inline'`, no `'unsafe-eval'`. Plus any script allowance from section 8. |
| `style-src` | `'sha256-<style>'` | `'sha256-<style>'` | Hash of the emitted style. `'unsafe-inline'` only after user confirmation (section 7 stop condition). |
| `img-src` | `data:` | `data: 'self'` | Plus image allowances from section 8. |
| `font-src` | `data: 'self'` | `data: 'self'` | Fonts are embedded as `data:` by default (section 8.4). |
| `media-src` | `'none'` | `'none'` | Only with a section 8 allowance. |
| `frame-src` | `'none'` | `'none'` | Only with a section 8 allowance. |
| `connect-src` | `'none'` | `'none'` | No network request is made by the page (FR-14). Confirmed (OQ-5 closed). |
| `base-uri` | `'none'` | `'none'` | Blocks `<base>` hijacking. |
| `form-action` | `'none'` | `'none'` | The page has no forms that post. |
| `object-src` | `'none'` | `'none'` | No plugins. |

- **FR-52** `frame-ancestors`, `sandbox`, and `report-uri` are not emitted in the meta tag, because
  browsers ignore them there. They are covered by FR-62.

### 7.2 Referrer and framing

- **FR-60** `<meta name="referrer" content="no-referrer">` is present in both modes.
- **FR-61** A small inline frame-busting fallback runs before the app. If the page detects it is
  framed cross-origin, it marks the export refused, hides the static shell, and attempts to
  navigate the top window to itself. The export must remain refused if the browser blocks that
  navigation; it must not flash the app or remain on an indefinite loader. Same-origin presenter
  mirror frames and top-level exports render normally. Why: a fallback only. The HTTP
  `frame-ancestors` header is the primary control (FR-62); a sandboxed frame can defeat script.
  The presenter's same-origin mirror frame keeps working; the presenter's injected `<style>` is
  replaced by an attribute selector in the hashed CSS.

### 7.3 Server-level headers

- **FR-62** Each export prints one line stating that `frame-ancestors`, `X-Frame-Options`,
  `X-Content-Type-Options: nosniff`, and HSTS must be set by the web server. A folder cannot set
  them.
- **FR-63** The export writes no server configuration file: no `.htaccess` (nginx ignores it) and
  no nginx config. Verify by listing the output folder.

## 8. External-Source Scan and CSP Allowances

Why: a deck can legitimately depend on an external font, image, or script. The policy must allow
exactly that, and no more, and say what was allowed.

### 8.1 What is scanned

- **FR-70** The scan covers deck and template sources only: the deck folder, the resolved template
  bundle, and the template manifest. The minified engine bundle is not scanned. Why: it produces
  false positives, such as URLs in React error messages.

### 8.2 Source to directive mapping

- **FR-71** Sources map to directives as follows:

| Source | Directive |
|--------|-----------|
| Template CSS `url()`, `@import`, `@font-face` | `style-src` / `font-src` |
| Template manifest `fonts` | `style-src` / `font-src` |
| `content.md` and `preview-props.json` `src` / `href` | `img-src` / `media-src` / `frame-src` |
| Layout `<script src>` | `script-src` |

- **FR-72** A source that cannot be classified to exactly one directive fails the export with an
  error naming the source. The export does not guess a directive.

### 8.3 Origin rules

- **FR-73** Allowances are exact origins (scheme, host, port). Wildcards (`*`, `https:`, bare
  host wildcards) are never emitted.
- **FR-74** Any `http:` source fails the export, naming the source. Why: mixed-scheme content is
  not allowed in an exported deck.
- **FR-75** Every allowance is printed on its own line with the directive it was added to and the
  source file that produced it.

### 8.4 Google Fonts

- **FR-76** External Google Fonts are downloaded at export time and embedded as `data:` in
  `font-src` by default. No `fonts.googleapis.com` or `fonts.gstatic.com` origin is allowed by
  default.
- **FR-77** The export reads each embedded font's OS/2 `fsType`. If embedding is restricted, it
  prints a warning naming the family and still embeds. Why: the licence is enforced earlier, at
  authoring time (FR-78, FR-79); the export is a backstop.
- **FR-78** The template validator checks every font the template uses. Catalog families pass
  (all are openly licensed @fontsource packages). Google Fonts imports pass and are listed as
  embedded at export. Font files bundled in the template fail validation when `fsType` restricts
  embedding or cannot be read. The check needs no network.
- **FR-79** The deck validator runs the FR-78 check on the deck's pinned `template/` snapshot, so a
  deck with a restricted font fails before export.

## 9. Headless CSP Check

Why: a CSP written by hand is easy to get wrong. The export proves the page loads with its own
policy active.

- **FR-80** After the export is written, the check loads the exported `index.html` in headless
  system Chrome. Chrome is located by the existing `findChrome()` in
  `engine/skills/presentation-crafting/scripts/export-pdf.mjs`, including its `--chrome` and
  `CHROME_PATH` overrides. The check does not add a new browser dependency.
- **FR-81** The check runs for both modes and records any `securitypolicyviolation` event. It
  reads the recorder state from Chrome `--dump-dom` output.
- **FR-82** Any violation fails the export with a non-zero exit. The message names the directive
  and the blocked URL or hash.
- **FR-83** If no Chrome is found, the export prints a warning that the CSP check was skipped, and
  the export still succeeds. The skip must be visible, not silent.
- **FR-84** Success metric SM-3: zero CSP console errors when the exported page is opened.

## 10. Non-goals

- Image recompression or resizing.
- Changes to PDF output format. PDF export only has to keep capturing every image (FR-6).
- Presenter view.
- Video in exports.
- Service worker or offline caching.
- Changes to the `.deck` format.

## 11. Constraints

- One shared preview runtime (`engine/preview-app`). Nothing deck-specific is added to the engine.
- Surgical changes. Files stay under the roughly 200-line soft cap; use kebab-case names.
- The de-duplication release lands and is released on its own before the mode and CSP work
  (`CLAUDE.md` Releases and Update Logs rules).
- `npm test`, `npm run build:check`, `npm run lint`, and `npm run typecheck` pass for each release.

## 12. Acceptance Criteria and Success Metrics

| ID | Criterion | Covers |
|----|-----------|--------|
| AC-1 | Each image payload appears once in the Marusei single-mode export, and the export reports its size against the 15 MB soft target. | FR-1, FR-5 |
| AC-2 | PDF export of the same deck captures every image. | FR-6 |
| AC-3 | Under a throttled connection, the loader is visible within about one second. | FR-20, FR-26 |
| AC-4 | Jumping to slide 38 early shows the gate, then the slide. | FR-23, FR-24 |
| AC-5 | Both modes render over `file://`, with no server running. | FR-11, FR-13 |
| AC-6 | Web-mode output contains no inlined image payloads and no server config files. | FR-12, FR-40, FR-63 |
| AC-7 | The exported page's meta policy matches section 7.1 for the mode. | FR-51 |
| AC-8 | An unclassifiable source, an `http:` source, or a wildcard fails the export. | FR-72, FR-73, FR-74 |
| AC-9 | Headless check fails the export on an injected violation, and warns and skips with no Chrome. | FR-82, FR-83 |
| AC-10 | Zero CSP console errors when opening each mode's output. | FR-84 |

Release gates: `npm test`, `npm run build:check`, `npm run lint`, and `npm run typecheck` pass.

## 13. Stop-and-Ask Conditions

Stop and ask the user, rather than deciding, when:

- Progressive reading of `text/plain` data blocks (FR-31) fails in Chrome or Safari.
- A template reads asset paths that the slide asset table cannot resolve.
- An external source cannot be classified to a directive (FR-72).
- A template needs an external origin to render.
- A strict `style-src` (no `'unsafe-inline'`) breaks a template.

## 14. Open Questions and Evidence

- **OQ-1** Closed by the browser spikes and current export checks: progressive `text/plain`
  blocks are used for single mode. Keep browser coverage in the focused export tests and the
  phase reports rather than duplicating test output here.
- **OQ-2** Closed: only web mode copies `assets/` (FR-15).
- **OQ-3** Closed: the headless check reads the recorder markers and violation payload from
  Chrome's `--dump-dom` output (FR-81). A missing `data-csp-check=ran` marker fails closed.
- **OQ-4** Closed for the supported artifact paths: web mode allows `'self'` for its adjacent
  assets; single mode uses data URLs. Browser evidence is recorded in
  `plans/261114-0021-progressive-html-export/reports/manual-acceptance.md`.
- **OQ-5** Closed: `connect-src 'none'` in both modes.
- **OQ-6** Closed: 15 MB is a soft target (FR-5).
- **OQ-7** Closed by the asset-reference review and export fixtures: CSS and nested asset
  references are covered by the source and asset scanners.
- **OQ-8** Closed by the shipped-template export checks. Inline override CSS is hashed; the
  native picker path was replaced with a CSP-safe custom picker after Safari evidence.
- **OQ-9** Closed for current shipped templates: external Google Fonts are embedded at export
  time and font licence checks remain authoring-validator checks with an export warn-only
  `fsType` backstop.
- **OQ-10** Closed: only assets referenced by rendered slides are embedded.
- **OQ-11** Closed by the PDF/manual checks: the PDF path loads the generated export and captures
  every slide image; its current evidence is in the phase reports.
- **OQ-12** Closed: the app script stays inline with a hash, same build in both modes.

Release evidence is stateful: see the [manual acceptance report](../../plans/261114-0021-progressive-html-export/reports/manual-acceptance.md),
[final picker review](../../plans/261114-0021-progressive-html-export/reports/review-export-picker.md),
and [CLI browser-launch verification](../../plans/261114-0021-progressive-html-export/reports/debug-cli-browser-launch.md).
These retain size-target misses, equivalent acceptance cases, browser revisions, and
superseding sandbox/native evidence. Publication remains pending the release workflow.

## 15. Code Owners

Read these for the current implementation. Do not copy their details into this document.

| Concern | Owner |
|---------|-------|
| Export build config | `engine/vite.export.config.ts` |
| Output folder assembly and rename | `engine/skills/presentation-crafting/scripts/export-standalone-html.mjs` |
| CLI entry, PDF step | `engine/cli/commands/output.ts` |
| Asset inlining | `engine/preview-app/vite-deck-plugin.ts` (`inlineDeckAssets`) |
| Authoring-only keys | `engine/preview-app/src/content-schema-v2.tsx` (`authoringSlideYamlKeys`) |
| Export HTML shell | `engine/preview-app/export.html` |
| Chrome lookup, PDF capture | `engine/skills/presentation-crafting/scripts/export-pdf.mjs` (`findChrome`) |
