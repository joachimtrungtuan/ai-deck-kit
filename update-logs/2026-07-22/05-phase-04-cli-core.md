# Phase 04: CLI Core

## What changed

- Added the Node/TypeScript `aideck` CLI under `engine/cli/` with a thin executable launcher.
- Added deterministic core commands: `init`, `upgrade`, `doctor`, `config`, `list`.
- Added deck lifecycle commands: `new`, slide add/remove/move, animation toggle, transition set, and canonical validation.
- Added template lifecycle, primitive catalog, outline scaffold, preview/export wrapper, and pack/unpack commands.
- Added per-slide `animation` and `transition` fields to the deck manifest schema so CLI mutations stay synchronized with `content.md`.
- Updated package metadata, engine TypeScript inclusion, architecture status, and Phase 04 plan status.

## Why

Make repeatable presentation boilerplate callable by either a user or an agent without model or network involvement, while preserving the Phase 02 `.deck` ownership boundary and Phase 06 runtime integration boundary.

## Verification

- Strict CLI TypeScript compile passed.
- Fresh temporary workspace passed init, new, outline scaffold, slide mutations, canonical validation, doctor, template lifecycle, primitive catalogs, pack, and unpack.
- Outside-workspace deck path was rejected with a non-zero exit code.
- `npm pack --dry-run --ignore-scripts` passed with generated Storybook output excluded from the package.

## Follow-ups

- Full arbitrary `.deck` preview/export source resolution remains Phase 06 work.
- Standard engine-wide `tsc --noEmit` still reports the pre-existing generated VIVIMOON deck React-type boundary and Storybook module-resolution diagnostics; focused CLI and Storybook-specific typechecks pass.
