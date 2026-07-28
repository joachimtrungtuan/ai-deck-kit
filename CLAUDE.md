# CLAUDE.md

Guidance for Claude Code in this repository. This file is the **source of truth**; `AGENTS.md` mirrors it for other AI agents (Codex, Gemini CLI, …). **AI Deck Kit treats non-Claude agents as first-class runtimes, so keep both in lockstep** — when updating one, update both. The two intentionally differ only where a mechanism is Claude-specific: skill invocation (slash command + Skill tool) here vs plain "READ the `SKILL.md`" in `AGENTS.md`, and Claude Code hooks / `.claude/` wiring that other agents ignore.

## Project Overview

**AI Deck Kit** (evolving from "AI Presentation") is a **portable, agent-native presentation toolkit**. It installs into any project on any machine; the AI agent (Claude Code, Codex, …) is the runtime, a deterministic Node/TS CLI (`aideck`) owns repeatable/boilerplate work, agent skills own the creative content work, and decks are portable `.deck` folder bundles. It stays content-first: the agent edits source, the user reviews content + rendered output. This is **not** a Google Slides clone.

**Core principles:** consistency, flexibility, portability, user control.

> **In transition (2026-07-22).** Vision, architecture, `.deck` format, per-module PRDs, and an 8-phase migration plan live in `docs/` and `plans/260722-0258-ai-deck-kit-restructure/`. **Phase 01 (workspace restructure) is done** — the two-root `engine/`/`decks/` split + root pointer are on disk. The `.deck` manifest format, CLI, primitives layer, and everything else are still **planned, not yet executed**. Read `docs/project-overview-pdr.md` + `docs/system-architecture.md` before further migration work.

## Structure (current — post Phase 01)

> `engine/` is the upgradable engine root; `decks/` + project-root `templates/` are gitignored user data. `ai-deck-kit.json` is the root pointer. `.deck` bundle internals (`deck.json`/`content.md` split) land in Phase 02.

```
AI Presentation/
├── ai-deck-kit.json                        ← Root pointer (engineRoot, decksRoot, engineVersion)
├── engine/                                 ← Upgradable engine root (ships with the toolkit)
│   ├── skills/                             ← Skills SOURCE OF TRUTH (symlinked into .claude/skills/
│   │   │                                      and .agents/skills/ — edit ONLY in engine/skills/)
│   │   ├── presentation-crafting/          ← Deck creation skill (content → slides)
│   │   └── presentation-template-creation/ ← Template-set authoring skill (catalogs, design systems, layouts)
│   ├── templates/                          ← Shipped, versioned *.template presets + catalog docs
│   │   ├── template-system.md              ← Master template-system rules
│   │   └── slide-types-v1.md               ← Versioned slide-type catalog
│   ├── preview-app/                        ← Single shared React preview + export runtime (Vite)
│   └── engine.version.json                 ← Pinned engine version + supported ranges
├── decks/                                  ← User data (gitignored): one {slug}.deck/ per deck
├── templates/                              ← User data (gitignored): user-authored .template bundles
├── update-logs/                            ← Dated change logs (see below)
├── plans/                                  ← Implementation plans & reports
└── docs/                                   ← Project documentation
```

## Way of Working (Presentation Crafting)

Activate the `presentation-crafting` skill for deck work (content → slides) and the `presentation-template-creation` skill for template-set or slide-type-catalog work. The skills are deliberately non-overlapping; never improvise either flow. Non-negotiable rules:

1. **One canonical Markdown content file per deck** (`decks/{slug}.deck/content/{slug}.slides.md`) — the source of truth for text, images, icons, speaker notes, and review annotations.
2. **One and only one template set per presentation.** Every slide derives from a declared slide type in the active slide-type catalog. No off-template improvisation.
3. **Templates are versioned** against the slide-types catalog version they implement.
4. **Overrides (layout/animation) are an explicit, recorded edge case** — justified in the content file, never the default flow.
5. **Icons:** icon-font approach, Phosphor-first (see skill's `icon-policy.md`).
6. **Animations:** gentle, attention-holding, from the approved preset vocabulary only.
7. **One shared preview runtime** (`engine/preview-app/`) — never scaffold per-template or per-deck apps.
8. **Validate before handoff:** decks with `presentation-crafting/scripts/validate-slide-content.mjs`; templates with `presentation-template-creation/scripts/validate-template-manifest.mjs`.

## Karpathy Coding Guidelines

ALWAYS activate the `karpathy-guidelines` skill (`/karpathy-guidelines`) when writing, reviewing, or refactoring code. Core behaviors:

- **Don't overcomplicate** — write the simplest code that solves the actual problem; no speculative abstraction.
- **Surgical changes** — touch only what the task requires; preserve surrounding style and structure.
- **Surface assumptions** — state them explicitly instead of silently guessing.
- **Verifiable success criteria** — define how the change will be checked before writing it, then verify.

## Token Discipline (non-negotiable)

Context is scarce; flooding it makes you thrash — more searches, more noise, wrong or stuck. Spend deliberately.

- **Bounded search.** Cap `Grep`/`Glob` output at ~50 matches. More than that → refine (scope `path`/`glob`, `head_limit`, sharper pattern). "Too many results" means *be more specific*, not read further.
- **Bounded reads.** Small files whole; large files in ~100-line windows via `Read` `offset`/`limit`, targeting the range you need. Use the line numbers `Read` prepends. **Never re-read a file already in context.**
- **Lint/compile after every edit** — fix a syntax error before anything else, not after tests fail and ten steps are burned.
- **Claude Code default: no subagent.** Keep work in Claude Code's main context. Do not delegate merely because a task is broad, touches many files, or could finish faster in parallel. Time and speed are lower priorities than wise token use.
- **Exception: genuine context efficiency.** Spawn a subagent only when it is extremely necessary to protect the main context from a large mechanical sweep, isolate a clearly bounded specialist task, or avoid a demonstrably larger token cost in the main run. First narrow searches and reads; if those are sufficient, do the work directly. Root-cause analysis, design, integration, edits, and decisions stay with the main agent.
- **Cheapest adequate Claude sub-run.** For an exceptional Claude Code subagent, prefer a low-cost Claude model such as `haiku`. Give it a narrow prompt and require only a distilled brief (paths, line ranges, facts). Do not spend high-tier Claude reasoning on mechanical reconnaissance.
- **Subagents run one at a time.** Never run them concurrently unless the user explicitly requests concurrency and it is genuinely necessary. This overrides the "Parallel Work" guidance in `.claude/rules/orchestration-protocol.md`.
- **Right-size the ceremony, never skip it.** Plan → implement → test → review, update-log entries, and docs sync stay mandatory; what scales is their *depth*. A one-line fix still earns an update-log entry with a terse inline plan; a real feature warrants the full chain.

## Coding Rules

Full rules: `.claude/rules/development-rules.md`. The ones that bite hardest:

- **Minimum code that solves the actual problem** — no speculative features, single-use abstractions, or unrequested flexibility (YAGNI/KISS/DRY).
- **Surgical changes** — every changed line traces to the request; don't refactor adjacent code; match existing style. Clean up only orphans your change created; flag pre-existing dead code rather than deleting it.
- **One concern per file**, ~200-line soft cap; split when either trips. Long descriptive kebab-case filenames (respect language conventions).
- **Think before coding** — state assumptions explicitly; multiple interpretations → present them, don't pick silently; unclear → stop, name it, ask.
- **Never hide or weaken a failing check** (lint, typecheck, build, test) to make it pass.

## Update Logs (required)

All non-trivial changes to this workspace must be logged in `update-logs/`. Each date gets its own subfolder (`YYYY-MM-DD/`). Log files are numbered incrementally with a short slug for chronological sorting:

```
update-logs/
  2026-05-21/
    01-install-vibework-mcp.md
    02-scaffold-claude-md.md
```

Each log briefly answers: **what changed, why, any follow-ups**. Trivial edits (typos, formatting) do not need a log.

### End-Of-Session Note (required on explicit user signal)

When the user explicitly ends the session ("end session", "wrap up", "stop here", "end this session for today", or equivalent), create a handoff log in the same dated folder named `NN-end-of-session-<slug>.md` where `NN` is the next sequential number. Do NOT auto-trigger from context limits, idle time, or inference — user must say so.

Purpose: a fresh agent (new session or different model) reads only this file and knows what was done, what remains, and where to resume — without re-reading the full conversation or redoing completed items.

Required sections:

1. **Session goal** — original user request that opened the session.
2. **Completed (DONE)** — items finished, with file paths + one-line purpose. Mark unambiguously DONE so the next agent skips them.
3. **In-progress** — work started but not finished, with current state + next concrete step.
4. **Key decisions** — scope, stack, or design choices made + reason.
5. **Files touched** — created / modified / deleted, with one-line purpose each.
6. **Unresolved questions or blockers** — items needing user input or external resolution.
7. **Pickup pointer** — recommended first action for the next session (file to open, command to run, question to ask).

Cross-reference the session's regular numbered update logs rather than restating them — the end-of-session note is an index and handoff, not a duplicate. If the session had no material changes, write a one-line note: `No material changes; nothing to hand off.`

### Session Start Protocol

At the start of every new session, before acting on the user's request:

1. Scan `update-logs/` for the most recent `*-end-of-session-*.md` (latest dated folder first, then highest `NN` within it). Read it if found.
2. From that note, internalize the **Completed (DONE)** list (skip these), **In-progress**, **Unresolved questions / blockers**, and **Pickup pointer**.
3. Surface a one-line orientation to the user, e.g. *"Last session ended <date> with pickup pointer: <X>. Continue there, or different focus?"* — do NOT silently auto-execute the pickup pointer.
4. If the user's opening request is unrelated, acknowledge prior context exists and follow the new request — the note is context, not a directive.
5. If no end-of-session note exists, or the read fails, proceed normally and mention it once.

Read the end-of-session note **once per session**, not on every task. Do not preload other numbered update logs — fetch them only when a specific item demands it.

## Workflows & Rules

- Development rules: `./.claude/rules/development-rules.md`
- Primary workflow: `./.claude/rules/primary-workflow.md`
- Orchestration protocols: `./.claude/rules/orchestration-protocol.md`
- Other rules: `./.claude/rules/*`

**IMPORTANT:** Analyze the skills catalog and activate the skills needed for the task.
**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.

**IMPORTANT:** *MUST READ* and *MUST COMPLY* all *INSTRUCTIONS* in project `./CLAUDE.md`, especially *WORKFLOWS* section is *CRITICALLY IMPORTANT*, this rule is *MANDATORY. NON-NEGOTIABLE. NO EXCEPTIONS. MUST REMEMBER AT ALL TIMES!!!*
