# Fix `aideck --version` reporting a stale `0.1.0`

**What changed:**
- `engine/cli/index.ts`: `VERSION` was a hardcoded literal (`"0.1.0"`), completely disconnected from `engine/package.json`, `ai-deck-kit.json`, and `engine/engine.version.json` — never updated across any prior release, including the 0.3.0 bump earlier today. Replaced it with a runtime read of `engine/package.json`'s `version` field (via `readFileSync` + `import.meta.url`, since the compiled `cli/dist/index.js` sits two directories below the engine root where `package.json` lives — a build-time JSON import would require the file inside tsconfig's `rootDir`).
- Rebuilt `engine/cli/dist/index.js` (`tsc --project tsconfig.cli-build.json`) and committed it alongside the source change, per `scripts/check-cli-build-is-current.mjs`'s gate.

**Why:** user reported `aideck --version` still printed `0.1.0` after the 0.3.0 version-bump commits (`4edf237`, `5a4c2a9`). Root cause: this was a fifth, independent version source never touched by any version-bump work (including the one performed earlier this session) — it was stale even relative to the prior `0.2.1`. Reading from `package.json` at runtime (rather than bumping the literal again) removes this as a version source entirely, so it can't drift on future releases.

**Verification:**
- `npm run typecheck` (engine) clean.
- `node engine/cli/index.mjs --version` and `node engine/cli/resolver.mjs --version` (the actual `aideck` bin entrypoint) both print `0.3.0`.
- `node scripts/check-cli-build-is-current.mjs` confirms the rebuilt dist matches source post-commit.

**Follow-ups:** none — checked the other files matched by the original grep (`engine/cli/tests/*.test.ts`, `engine/cli/commands/templates.ts`); their `"0.1.0"` references are unrelated test fixtures for `engineVersion` workspace-compatibility checks (used by `aideck verify`), not the CLI's own `--version` output.
