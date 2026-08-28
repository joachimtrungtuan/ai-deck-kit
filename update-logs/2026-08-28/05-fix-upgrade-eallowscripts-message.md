# Make `aideck upgrade` fetch failures self-documenting (EALLOWSCRIPTS)

**What:** `fetchEngine()` in `engine/cli/commands/upgrade.ts` now throws via a new
`unfetchableEngineMessage()` helper that appends the generic escape hatch
(`npm_config_userconfig=/dev/null aideck upgrade`) to the bare
"Could not fetch engine source from ..." line. Added a matching README troubleshooting entry.
Bumped `1.0.0` → `1.0.1` in the four version-carrying files
(`package.json`, `engine/package.json`, `engine/engine.version.json`, `ai-deck-kit.json`)
and rebuilt `engine/cli/dist`.

**Why:** reported live from an installed project (`.../slides`). `aideck upgrade` failed with:
```
npm error code EALLOWSCRIPTS
npm error --allow-scripts is not allowed in project-scoped installs.
Error: Could not fetch engine source from github:joachimtrungtuan/ai-deck-kit.
```
Root cause: the user's `~/.npmrc` contained `allow-scripts=@opencode-ai/cli`. npm prepares a
git-sourced package by spawning a nested, project-scoped `npm install` that inherits the user
npmrc; npm 12 rejects `allow-scripts` in that context, the nested install dies, and `npm pack`
exits non-zero. Our error text named none of this, so the failure was a dead end — the user
opened a debugging session rather than finding the workaround.

This is the second instance of the same shape: the 2026-08-09 fix handled `allow-git` the same
way (a setting leaking into the nested install). Rather than blocklist setting names one at a
time, the message now points at the class-wide escape hatch, which covers whatever npm
restricts next.

**Deliberately not done:** no code change to the fetch itself. Options considered were
(a) copying `~/.npmrc` minus `allow-scripts` into a temp file, and (b) auto-retrying with a
sanitized npmrc. Both were declined for now — two occurrences is a pattern but not yet enough
to justify code that swallows a real error before retrying. Revisit if this recurs.
`/dev/null` is documented as the user-facing workaround with a caveat to comment out the single
offending setting instead if they keep registry auth in `~/.npmrc`.

**Verified:**
- Reproduced the exact failure in a scratch dir, then confirmed only
  `npm_config_userconfig=/dev/null` fixes it (`npm_config_allow_scripts=` empty still fails —
  it parses as `[""]`, not the default).
- Triggered a real fetch failure in a scratch workspace via `AIDECK_PACKAGE_SPEC` pointing at a
  nonexistent repo; the new three-line message printed as intended.
- `npm run lint` (11 files), `npm run typecheck`, `npm run validate` all green;
  `npm run test:serve` 35/35 passing.
- `npm run build:check` reports the rebuilt `engine/cli/dist/commands/upgrade.js` as
  uncommitted — expected, it passes once the dist is committed alongside the source change.

**Follow-ups:** none blocking. Uncommitted at time of writing.
