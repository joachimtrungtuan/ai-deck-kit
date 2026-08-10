# Agent pass verifier (`aideck verify`) and deck-aware write guard

Continues `update-logs/2026-08-09/05-engine-boundary-lockdown.md`.

## Why

The lockdown stopped writes *into the engine*, one file at a time. The damaging outcomes are
states, not single writes: a template edited inside a deck's frozen `template/` copy, a deck
whose content stopped validating, a layout that no longer parses. Editing is when those
appear, and by the time anyone opens a preview the agent has moved on.

So: a deterministic check that runs when the agent finishes an editing pass, not a command a
human has to remember. Five things it must answer — template edits inside the `.template`
package, deck edits inside the `.deck` package, no cross-edit (a template edited in a deck),
nothing touched that an upgrade will not preserve, no lint error left behind.

## What changed

**`aideck verify` (`engine/cli/commands/verify.ts`)** — everything the kit can check by
reading a workspace: engine drift, per-template manifest + layout parse, deck manifest and
content validation, template edits inside a deck's snapshot, loose files beside the bundles.
Read-only and free of subprocesses except the content validator, because it runs constantly.
`doctor` is now `verify` plus the machine-prerequisite probes — the probes are ~6 subprocesses
and a printed table, which a per-pass check must not pay for.

- **Cross-edit detection** — `snapshotEdits` (`cli/lib/deck-template-sync.ts`) compares the
  deck's `template/` tree against its source, using a shared tree hasher lifted out of
  `engine-integrity.ts` into `cli/lib/fs.ts` (`hashTree`). The snapshot is only ever written
  whole by the CLI, so at a matching version *any* byte difference is a template edit made in
  the wrong place. Only meaningful while the deck is `current`; `ahead` was reclassified from
  a note to an error, since it is the signature of a snapshot edited and bumped in place.
- **Layout parse** — `cli/lib/template-source-syntax.ts` runs `esbuild.transformSync` over the
  bundle's `.tsx/.ts/.jsx/.js/.mjs/.css`. That is the only code a consumer-project agent
  authors, and esbuild is already installed for the preview build (now declared in
  `engine/package.json` rather than relied on as a hoisted vite transitive). Degrades to a
  no-op if esbuild cannot be resolved.

**Write guard extended (`cli/lib/claude-engine-guard.ts`)** — it now refuses the CLI-owned
parts of a deck as well as the engine: `deck.json` (use `aideck slide|anim|transition`),
`template/` (edit the real template, then `aideck deck retemplate <slug>`), and `.build/`.
Each refusal carries its supported route.

**Stop hook (`cli/lib/claude-verify-hook.ts`)** — runs `aideck verify` in the workspace when
the agent stops; on failure it prints the output and exits 2, so the agent has to fix the
workspace before it can finish. Honours `stop_hook_active`, or the hook would block the stop
it caused. Registration for both hooks now shares `cli/lib/claude-hooks.ts`.

**Wiring** — `skills wire` installs both behind one consent prompt (they edit a user-owned
`settings.json`), and refreshes the scripts without re-asking once a home already runs them.
`upgrade` calls `rewireProjectAgentHomes`, so one command refreshes skills *and* safeguards
against the engine tree it just replaced; a stale hook script pointing into a replaced engine
is worse than none.

**Docs** — README boundary section (four honesty mechanisms, deck-internal ownership) and
troubleshooting; `docs/system-architecture.md` write-boundary table (five layers) and module
map; `workspace-boundary.md` gained a "check your own work" section; both `SKILL.md` validate
steps name `verify`; the consumer `AGENTS.md`/`CLAUDE.md` block does too. Fixed the
cross-skill link in `presentation-template-creation/SKILL.md`, which pointed at
`presentation-crafting/references/...` from a sibling directory — now `../presentation-crafting/…`,
which resolves both in `engine/skills/` and through the `.claude/skills/` symlinks.

## Verified

- `lint`, `typecheck`, `validate`, `test:serve` (26), `test:lifecycle` (6), `test:smoke` — pass.
- New `engine/cli/tests/workspace-boundary.test.ts` (12, `npm run test:boundary`): clean
  workspace verifies; in-deck template edit named as a cross-edit; snapshot bumped in place
  refused rather than reported as drift; strays beside the bundles; engine edit reported once
  an integrity manifest exists and *not* without one; unparseable layout caught; the guard
  refusing `deck.json`, `template/`, `.build/` and the engine while allowing `content.md`,
  `assets/` and the real template; the guard inert in an uninstalled project; the Stop hook
  surfacing CLI output at exit 2 and standing down on `stop_hook_active`; hook registration
  idempotent and non-destructive to unrelated hooks.

## Follow-ups

- `npm run build:check` fails until the rebuilt `engine/cli/dist` is committed with the
  source — expected pre-commit.
- Nothing here is registered in a CI workflow; the repo has no workflow that runs the test
  scripts. `test:boundary` is in `package.json` and the README maintainer block.
