# Fix `aideck upgrade` EALLOWGIT failure on npm 12+

**What:** `fetchEngine()` in `engine/cli/commands/upgrade.ts` now passes
`npm_config_allow_git: "all"` in the environment of its `npm pack github:...` call. Bumped
`0.2.0` → `0.2.1` in the four version-carrying files. Added a README troubleshooting note
for the initial `npx github:...ai-deck-kit init --here` install command.

**Why:** npm 12 defaults `allow-git` to `"none"`, blocking all git-protocol (`github:...`)
package fetches unless explicitly allowed. This broke `aideck upgrade` for any user on
npm 12+ with:
```
npm error code EALLOWGIT
npm error Fetching packages of type "git" have been disabled
Error: Could not fetch engine source from github:joachimtrungtuan/ai-deck-kit.
```
Reported live from an installed project (`.../claude-for-marketers/slides`). Root-caused via
`npm config list -l` showing `allow-git="none"` as a built-in npm 12 default with no
overriding `.npmrc` anywhere (user/global/project). Verified fix by a scratch
`npm_config_allow_git=all npm pack github:joachimtrungtuan/ai-deck-kit` fetch that
succeeded where the bare command failed.

**Scope note:** the initial `npx github:...` install command resolves its git-protocol
fetch inside `npx` itself, before any of our bundled code runs — that call site can't be
patched from within the CLI, so it's covered by a README workaround/troubleshooting note
instead (prefix the command with `npm_config_allow_git=all`).

**Verified:** `npm run lint && npm run typecheck && npm run validate && npm run build:check`
and `npm run test:serve` (25/25 passing) — all green after the fix and rebuild.
