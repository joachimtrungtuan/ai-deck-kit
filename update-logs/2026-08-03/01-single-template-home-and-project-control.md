# Single template home, drift re-sync, and full project control

Plan: `plans/260803-1633-full-project-control-and-seamless-upgrade/plan.md` (all 7 phases landed).
Origin: red-team review `plans/reports/code-review-260803-1610-cli-toolkit-red-team.md`.

## Why

The user reported the toolkit serving the wrong thing — asking for the Courseware template and
getting the shipped default, and confusing the Vivimoon deck with a template. Root causes were
structural, not cosmetic: two template locations (a "draft" copy could shadow an "installed" one),
a preview plugin that silently fell back to a shipped template when a bundle was missing, and no
command that ever told you which file it had actually resolved.

## What changed

**One template home.** All user templates live in `<project>/templates/{name}.template/`.
`engine/templates/` now holds shipped defaults only, read-only, replaced on upgrade. No
draft/installed split, no `template register` step. A project template of the same name wins over a
shipped default, and every resolution path says which one it used. Legacy installs that had
templates registered inside `engine/templates/` get them relocated automatically on upgrade/doctor.

**No silent fallback.** `vite-deck-plugin.ts` resolves project-first and errors naming both
locations rather than substituting another template. `serve` prints the resolved deck path, or the
template name + origin + version + path, before Vite starts, and fails at the CLI on an unknown
target with a "did you mean" hint. Passing a template name where a deck is expected now fails with
the correct command instead of rendering something plausible.

**Drift and re-sync.** `deck.json` records `template.origin` (`shipped | project`), so an engine
upgrade is distinguishable from a user editing their own copy. `aideck deck status` reports
`current | behind | ahead | source-switched | source-missing | unknown-origin`.
`aideck deck retemplate <slug> [--to <name>]` re-syncs exactly one deck: backs up the frozen
snapshot, refuses targets missing a needed slide type, restores on failure, never touches
`content.md`, and prints that visual review is still required. There is deliberately no `--all`.

**Versioning is an agent discipline.** The CLI never edits or bumps a template. The
`presentation-template-creation` skill now owns patch/minor/major sizing rules; the CLI only reads
versions to detect drift. An unbumped edit is invisible drift — stated in the skill and the PRD.

**Removal and repair.** `remove deck`, `remove template --reassign`, `uninstall [--purge]`,
`reinstall`. Every destructive command prints its full target list, requires `--yes`, and refuses
any path at or outside the project root. `remove template` refuses shipped defaults and refuses to
delete a template decks still use unless `--reassign` re-templates them first.

**Seamless upgrade.** `upgrade` now reinstalls engine dependencies (previously `serve`/`export` were
dead afterwards while `doctor` still printed "passed"), rescues legacy templates before replacing
the tree, and doctor gained a preview-runtime check. Never delete-and-reinstall.

**Windows.** Now an explicit, up-front hard preflight failure with a WSL pointer rather than
half-support. The Windows remedy branches in `lib/prerequisites.ts` are gone.

## Verification

`npm run lint` (11 files) · `npm run validate` (3 templates + release package) · `npm run typecheck`
· `npm run test:serve` 24/24 · `npm run test:lifecycle` 6/6 · `npm run test:smoke` full end-to-end
including PDF export, engine upgrade to 0.1.1, and doctor over 3 decks. All green.

## Follow-ups

- **`engine/skills/presentation-crafting/templates/export-runtime/`** still holds a pre-`.deck`
  snapshot (`deck-registry.tsx`, `export-main.tsx`, `deck-export.tsx`) referencing the old
  `working-files/` layout. Left in place per the "flag, don't delete pre-existing dead code" rule;
  both `SKILL.md` and `references/export-runtime-contract.md` now label it legacy and forbid copying
  from it. **Decision needed: delete it or keep it as a reference?**
- `engine/cli/lib/command-registration.ts` still branches on `win32` for global-bin paths. Harmless
  and unreachable now that preflight hard-fails on Windows; left alone to keep the change surgical.
- Remote release publication and a registry-backed clean install remain unverified (pre-existing).
