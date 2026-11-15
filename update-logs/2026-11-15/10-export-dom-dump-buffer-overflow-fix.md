# Export: Chrome DOM dump overflowed pipe buffer (ENOBUFS)

## What changed

- `engine/skills/presentation-crafting/scripts/export-html-csp-headless-check.mjs` — Chrome `--dump-dom` output is now streamed to a temp file in the per-run profile dir instead of a 32 MB pipe buffer; failure details truncate the DOM to 2000 chars.
- `engine/skills/presentation-crafting/scripts/export-pdf.mjs` — the capture pass's DOM dump now goes through the existing `runToFile` helper (was `run` with a 64 MB pipe cap).
- `engine/cli/tests/export-html-csp-headless-check.test.ts` — regression test: a 40 MB fake Chrome dump is judged (fails on old code, passes now).

## Why

On kit 1.5.0, `aideck export html marusei-261112-proposal-v01` (Vân Tay Media pitch decks project) failed with `Export CSP check failed … spawnSync … ENOBUFS`. The single-file export embeds assets as base64 (index.html ≈ 29.9 MB), so the rendered DOM exceeded the 32 MB `maxBuffer`. The page itself ran fine (`data-csp-check="ran"`, `data-export-ready="true"`); the check failed closed on a truncated dump. Any deck with enough embedded images hits this, and PDF export would hit the same class of bug at 64 MB.

## Verification

- Patched check run directly on the user's real 29.9 MB export: passes (~10 s).
- `npm test` 234/234 + new test, `npm run lint`, `npm run typecheck`, `npm run validate` pass.

## Follow-ups

- Not yet committed or released. The user project still runs engine 1.5.0; it needs a patch release (1.5.1) and `aideck upgrade` to pick up the fix.
