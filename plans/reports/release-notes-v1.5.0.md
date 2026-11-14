### Added

- **Web-mode HTML export.** `aideck export html <deck> --mode web` writes a static folder with `index.html` and only the rendered slide assets.
- **Progressive startup.** HTML exports show the loader immediately, prioritize the first four slides, and gate/re-prioritize when a viewer jumps ahead.

### Changed

- **Single mode remains the default.** It produces one self-contained `index.html`; web mode may load its adjacent same-origin `assets/` files, while neither mode makes external runtime network requests.
- **Export security is enforced in the build.** Source scanning rejects HTTP, wildcard, and unclassifiable sources; Google Fonts are embedded at export time; strict CSP, no-referrer, frame refusal, and the headless CSP check are applied consistently.
- **The slide picker is CSP-safe.** Exported navigation uses an accessible custom listbox with keyboard and focus handling.

### Fixed

- **Late-slide asset loading is bounded.** A jump to an unready slide waits at that slide instead of rendering an incomplete slide.
- **Browser-specific CSP noise is removed.** The native select path that triggered Safari `style-src-attr` reports was replaced without relaxing the policy.

### Docs

- **Updated the owning docs.** README, export PRD and requirements, system architecture, presentation-crafting skill, workflow reference, and changelog now describe the current export contract and evidence.

### Upgrading

No content-schema change is required. Run `aideck upgrade` to replace the engine, then re-export decks to use progressive loading and either HTML delivery mode. Publishing this version remains approval-pending until the release workflow is run.

**Full changelog:** https://github.com/joachimtrungtuan/ai-deck-kit/compare/v1.4.1...v1.5.0
