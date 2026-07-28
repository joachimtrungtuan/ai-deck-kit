# Install, onboarding, and docs overhaul

## Why

Audit of the implementation against `docs/` (the requirements source of truth) found the core
engine matching the docs closely, with all material drift concentrated in the install /
onboarding layer: the installer never wired the agent skills, never checked prerequisites, and
there was no way to make `aideck` typeable. The README also assumed a technical reader.

Audit report: `plans/reports/audit-260728-1457-docs-vs-implementation.md`.

## What changed

### Installer (`aideck init`)

- **Prerequisite preflight** (`engine/cli/lib/prerequisites.ts`). Hard: Node ≥ 22.6.0, npm, git —
  abort before writing anything. Soft: `zip`/`unzip`, Chrome, ImageMagick — warn, naming the
  feature each unlocks. Per-platform remediation lines. `--skip-checks` downgrades hard failures.
  `aideck doctor` prints the same report.
- **Skill wiring** (`engine/cli/lib/agent-skills.ts`, `commands/wire-skills.ts`). Links
  `engine/skills/*` into `.claude`/`.agents`. Agent home at the project root wires silently; a home
  found further up prompts with three options (use it / type a path / skip). Relative symlinks with
  a copy fallback; never replaces a directory the toolkit did not create. Non-interactive runs wire
  only a root-level home, leaving CI untouched. Re-runnable as `aideck skills wire [--to <path>]`.
- **Project wrapper.** `./aideck` written at the project root, so the kit works with no global step.
- **Version-control boundary** (`engine/cli/lib/project-gitignore.ts`). Ignores the resolved engine
  directory, `/aideck`, and `**/.build/`; leaves `decks/` and `ai-deck-kit.json` committable, matching
  the boundary `docs/system-architecture.md` already described. Creates the file when absent, appends
  when present, and does nothing when its block is already there.
- **Plain-language output** for what was planted, next steps, and dependency-install failures.

### Command registration (`aideck link` / `unlink`)

- What is registered is `engine/cli/resolver.mjs`: it walks up to the nearest `ai-deck-kit.json` and
  runs *that* workspace's engine. Register once per machine; every project keeps its own pinned
  engine, and moving or re-installing a project needs no re-registration.
- `package.json`'s `aideck` bin now points at the resolver instead of `engine/cli/index.mjs`. The old
  mapping meant a global install ran the globally installed engine against every other project.
  A legacy `npm link`-style symlink is detected and upgraded rather than refused; an unrelated
  binary of the same name is still refused.
- `globalBinDir()` prefers an explicit npm prefix env override, then `npm prefix -g` **when that path
  exists**, else the directory holding the running `node`. npm masks path segments it mistakes for
  secrets, which previously made registration write to a literally mangled path.

### Docs

- `README.md` rewritten for a mixed technical / non-technical audience: prerequisites and how to
  install them → install → what got planted → skills → command registration → first deck → browser
  review → resuming earlier work → export/share → upgrade → troubleshooting table. Every command was
  executed against a real install before being documented.
- `docs/deployment-guide.md`: install sequence, skill wiring, and command-registration mechanics.
- `docs/system-architecture.md`: onboarding module row, `unpack` added to the export row, install and
  command-resolution bullets.
- `docs/codebase-summary.md`, `docs/modules/distribution-cicd-module-prd.md` updated to match.
- `<owner>` placeholders replaced with `joachimtrungtuan/ai-deck-kit` across `docs/`.
- `CLAUDE.md` + `AGENTS.md` synced: stale "CLAUDE.md says the CLI is not yet executed" transition note
  replaced with current status, canonical deck content path corrected to `decks/{slug}.deck/content.md`,
  stale `presentation/preview-app/` path fixed in `AGENTS.md`.

## Verification

`npm run lint`, `typecheck`, `validate`, `test:serve`, `test:smoke` all pass. Additionally, a real
end-to-end install into a fresh folder with a root `.claude`: preflight, dependency install, automatic
skill wiring, `new`, `list`, `export html`, `pack`, `unpack`, `doctor`, `template list`, and the
`--dir tools/ai-deck-kit` variant. Registration verified against an isolated npm prefix: legacy-link
upgrade, foreign-binary refusal, unlink refusal + removal, and resolution from the project root, a
nested subdirectory, and outside any workspace.

## Follow-ups

- The legacy registration `/opt/homebrew/bin/aideck → .../AI Presentation/engine/cli/index.mjs` was
  removed with `npm rm -g ai-deck-kit` at the user's request, so no global `aideck` exists on this
  machine right now. Run `aideck link` from any workspace to register the resolver instead.
- Installing into the user's real target project is deferred at their request.
- Remote release publication and a registry-backed clean install remain unverified.
