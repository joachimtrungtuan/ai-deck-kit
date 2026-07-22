# Clarify subagent token policy

## What changed

- Updated `CLAUDE.md` and `AGENTS.md` in lockstep.
- Made direct main-context work the default.
- Limited subagents to exceptional context-efficiency cases.
- Addressed each file's intended agent directly: Claude Code and Claude models in `CLAUDE.md`; non-Claude agenting tools and their low-tier models in `AGENTS.md`.
- Required sequential, cheapest-adequate sub-runs: Haiku for Claude Code; low reasoning and a low-tier model such as GPT-5.6 Luna for other agenting tools.

## Why

Token efficiency matters more than completion speed. Broad scope or parallel opportunity alone must not trigger delegation.

## Follow-ups

None.
