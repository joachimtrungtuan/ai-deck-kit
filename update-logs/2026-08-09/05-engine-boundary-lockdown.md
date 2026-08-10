# Engine boundary lockdown

Plan: `plans/260809-1946-engine-boundary-lockdown/plan.md`

## Why

Template work was landing in `engine/preview-app/vite-deck-plugin.ts` in an installed
project. Upgrade replaces `engine/` whole and the folder is gitignored, so such an edit is
invisible while it exists and gone without warning afterwards.

Two causes, not one:

- **Mode A** — skills written for *this* repo shipped verbatim to consumers and told the
  agent to edit engine files.
- **Mode B** — for preview fixtures and typefaces the engine was genuinely the only place
  the data could live. A lock alone would have walled the agent in, so mechanism came
  before enforcement.

## What changed

**Template-owned data (Mode B).**

- `preview-props.json` per `.template` bundle, shallow-merged over the runtime defaults,
  scoped per template in the gallery so fixtures cannot bleed between templates.
  `engine/preview-app/vite-deck-plugin.ts`, `engine/cli/lib/templates.ts`
  (`validatePreviewProps`, scaffold writes an empty file).
- Manifest `fonts` array resolved against a closed catalog of 12 families:
  `engine/cli/lib/font-catalog.ts` (in `cli/lib` because `tsconfig.cli-build.json` pins
  `rootDir: "cli"`). Unknown family = validation error naming the catalog.
- Both shipped templates now declare `fonts: ["inter", "jetbrains-mono"]`;
  `templateVersion` 1.0.0 → 1.1.0.
- Removed the Newsreader baseline from `preview-app/src/main.tsx` and `export-main.tsx`.
  It was used by no shell CSS and no shipped template, and rode along in every export.
  Inter + JetBrains Mono stay: `preview-shell.css`, `export-shell.css` and
  `template-gallery.css` name them literally. Test replaced accordingly — the old one
  pinned Newsreader's two stylesheets in the export entry, i.e. the coupling being removed;
  the new pair asserts the catalog answers for a family as a whole and that the export
  entry hardcodes nothing beyond its own shell.

**Boundary contract (Mode A).**

- New `engine/skills/presentation-crafting/references/workspace-boundary.md` — canonical:
  two workspace modes, detection (`git check-ignore engine`), ownership tree, needs →
  supported route.
- Hard-rule block in both `SKILL.md` files (duplicated deliberately: the bundles symlink
  independently).
- Three engine-edit instructions rewritten to stop-and-report: `@fontsource` imports in
  `preview-and-verification.md`, runtime patching in `export-runtime-contract.md`, and
  slide-type catalogs. The last one escalates rather than relocating, because a new catalog
  needs both `engine/templates/slide-types-v(N+1).md` *and* a `supportedSlideTypeCatalogs`
  entry that `doctor` enforces — a project-root catalog would be rejected.

**Enforcement.**

- `engine/cli/lib/engine-integrity.ts` — sha256 manifest written by `init`/`upgrade`.
  `doctor` reports drift as an error; `upgrade` warns and proceeds (blocking would strand a
  user whose only way forward is the upgrade). `cli/dist` is recorded (it is the shipped
  CLI); `preview-app/dist` is not.
- `engine/cli/lib/claude-engine-guard.ts` — PreToolUse hook denying writes inside an
  installed engine, offered by `aideck skills wire`. Resolves the workspace from the edited
  file, so one agent home can sit above several projects.
- `engine/cli/lib/project-agent-rules.ts` — marker-delimited boundary block merged into the
  project's `AGENTS.md` and `CLAUDE.md`. `init` offers it (creates if missing);
  `upgrade` offers it too, but without a TTY refreshes only files that already exist, so CI
  never introduces new files.

Every layer keys off an installer-written artifact, so all of it is structurally inert in
this repository.

**Also fixed:** `scripts/ci-smoke.mjs` hardcoded an upgrade to `0.1.1`, which stopped
working at the 0.2.x bumps. It now derives the target from the current engine version.

## Verified

- `typecheck`, `lint`, `validate`, `test:serve` (26), `test:lifecycle` (6), `test:smoke` — pass.
- End-to-end rehearsal in a scratch project: init → template with a non-default font
  (Fraunces) and custom preview props → deck → export → engine edited three ways →
  `doctor` names changed/added/deleted → `upgrade` warns, replaces, reinstalls, `doctor`
  clean, template and deck intact. Export embeds Fraunces; Newsreader is gone.
- Guard hook across five payloads: engine write denied (exit 2), template/deck writes
  allowed, kit-repo engine write allowed, non-write tool allowed.

## Follow-ups

- `npm run build:check` fails until the rebuilt `engine/cli/dist` is committed with the
  source — expected pre-commit.
- `scripts/ci-smoke.mjs` excludes any directory basenamed `dist` when staging the upgrade
  source, which strips `cli/dist` too, so the post-upgrade CLI in that fixture is
  unrunnable. Nothing is asserted after the upgrade, so the smoke test still holds; worth
  narrowing to `preview-app/dist`. Pre-existing, left alone.
- Remote release publication and registry-backed clean install remain unverified.
