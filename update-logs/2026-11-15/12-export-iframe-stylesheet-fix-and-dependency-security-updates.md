# Export iframe stylesheet fix + dependency security updates

## What changed

### Broken layout in HTML exports (single + web), since v1.5.0
- **Symptom:** exported decks rendered without their deck CSS (wrong fonts, collapsed layouts) in both `--mode single` and `--mode web`. Reported on `marusei-261112-proposal-v01.deck`.
- **Root cause:** progressive asset loading (34233ae) moves the inlined deck stylesheet from `<head>` into `<body>` (`moveAppScriptIntoBody` in `export-html-assembly.mjs`) so the loader paints first. Slides render inside `iframe.fixed-slide-frame`, and `FixedSlideCanvas.initFrame()` cloned only `document.head` styles into it. The CSS *was* embedded, it just never reached the iframe.
- **Fix:** `engine/preview-app/src/fixed-slide-canvas.tsx` clones `style, link[rel='stylesheet']` from the whole document. Slide override `<style>` tags live in the iframe document, so they are not double-cloned.
- **Verified:** re-exported the reported deck in both modes. The iframe holds the 15.4 MB deck stylesheet, the deck font (`Finlandica Text`) resolves, the slide is 1600×900, and screenshots match the intended design.

### Engine dependency security updates (`engine/package.json` + lock)
- `vite` ^7.0.0 → ^7.3.8 (runtime dep): high-severity dev-server advisories (launch-editor, cross-origin script exec, `server.fs.allow` bypass).
- `storybook` + `@storybook/react-vite` ^10.5.3 → ^10.6.7 (dev): **critical** dev-server code injection / missing origin validation.
- `npm update` + `npm audit fix`: in-range bumps (react 19.3.1, esbuild 0.28.2, vite-plugin-singlefile 2.3.4, yaml 2.9.1, agentation 3.1.2, @types/*) and transitive fixes (brace-expansion, nanoid, source-map-js, postcss).
- Audit: 10 vulns (1 critical, 4 high, 5 moderate) → 4 moderate.
- Checks: `npm test` (235 pass), `build:check`, `lint`, `typecheck`, `validate` all green.

## Follow-ups
- **Remaining 4 moderate advisories (accepted):** `glob` 13 / `minimatch` 10, reached only through `@storybook/react-vite` → `@joshwooding/vite-plugin-react-docgen-typescript@0.7`. They are dev-only, and the patterns come from plugin config, not untrusted input. npm's "fix" downgrades to Storybook 8. Clears when Storybook moves to docgen plugin ≥0.9 (which drops glob).
- **Majors not taken (not security-driven):** vite 8, TypeScript 7, @vitejs/plugin-react 6.
- **No regression test** covers iframe style cloning. Candidate: an assertion in the export headless check that the slide iframe contains the deck stylesheet.
- Committed and pushed to `main` without a version bump or release (user's call). Ship as patch release 1.5.2 per the release process.
