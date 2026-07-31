# Ship a compiled CLI so npx installs work

## What changed

The CLI now runs compiled JavaScript (`engine/cli/dist/`) instead of stripping types
from `.ts` at runtime. That compiled output is committed.

- `engine/tsconfig.cli-build.json` — build-only config; emits `cli/**/*.ts` to
  `cli/dist`, rewriting `./x.ts` specifiers to `./x.js`. Excludes tests.
- `engine/cli/index.mjs` — imports `./dist/index.js`. Dropped the child-process
  spawn and the `--experimental-strip-types` flag; neither is needed now.
- `engine/cli/lib/engine-root.ts` (new) — finds the engine root by walking up to
  `engine.version.json`.
- `engine/cli/lib/command-registration.ts`, `engine/cli/commands/init.ts` — use it
  instead of paths relative to their own module depth.
- `scripts/check-cli-build-is-current.mjs` (new) + CI step — rebuilds and fails if
  the committed output differs from source.
- `.gitignore` — re-include `engine/cli/dist/` against the blanket `dist/` rule.
- `package.json`, `engine/package.json` — `build`, `build:watch`, `build:check`.

## Why

`npx github:joachimtrungtuan/ai-deck-kit init --here` failed for every user on every
Node version with `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`. Node refuses to strip
types for any file under `node_modules/`, and the flag does not override it. npx always
installs there, so the documented install command could never work.

It went unnoticed because development runs from the source checkout, which is not under
`node_modules`, where stripping is permitted. Note that `npm link` and `npm i <path>`
also pass, because Node resolves symlinks before applying the check — only a packed
tarball reproduces the real install.

Distribution is git-only (no registry publish), so there is no publish step to hang a
build on. Committing the output keeps installs fast and offline-capable and avoids
depending on npm running `prepare` for git installs. The cost is that a source change
must be committed with its rebuild, which `build:check` enforces.

Moving to `cli/dist/` changed the depth of two runtime path lookups — the resolver shim
read and init's distribution root — which would have silently resolved inside `cli/dist`.
Hence the engine-root helper rather than adjusted `../` counts.

## Verification

Packed a tarball and installed it into a scratch project (a real copy, not a symlink):
`--version`, `doctor`, and `init --here` all succeed from `node_modules`. The planted
workspace runs via its own `./aideck`. Also passing: lint, typecheck, validate,
test:serve (18/18), test:smoke.

## Follow-ups

- Nothing exercises the packed-tarball install automatically; `test:smoke` runs from the
  checkout and would not have caught this. Worth adding to CI.
- `init` copies the engine and then runs `npm install` in it (~188 MB in the scratch
  test). Pre-existing, unrelated to this change, but worth a look.
