# Targeted serve preview

## What changed

- Extended `aideck serve` with `--template <name>`, browser auto-open, and `--no-open`.
- Kept bare `aideck serve` as the shared installed-template gallery and preserved `--deck`.
- Added draft-first template resolution, structural validation, dynamic template loading, scoped CSS, and live reload through the existing shared Vite app.
- Added focused CLI/resolver tests and documented the preview workflows.

## Why

Deck and template review should be a one-command, read-only browser workflow while source editing remains with AI agent tools. A second preview application was unnecessary.

## Follow-ups

- None.
