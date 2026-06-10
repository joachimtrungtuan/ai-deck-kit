# CLAUDE.md

Guidance for Claude Code in this repository. This file is the **source of truth**; `AGENTS.md` is a mirror adapted for other AI agents — when updating one, update both.

## Project Overview

**AI Presentation** is a presentation-generation workspace. The agent and user collaborate to create beautifully crafted, browser-based slide decks (React source, with static HTML export) through a controlled, content-first workflow.

This is **not** a Google Slides clone. The agent edits source; the user reviews content and rendered output. Goal: lightweight, beautiful, consistent presentations in a short time.

**Core principles:** consistency, flexibility, and user control.

## Structure

```
AI Presentation/
├── skill-engineering/                      ← Skills SOURCE OF TRUTH (symlinked into .claude/skills/
│   │                                          and .agents/skills/ — edit ONLY in skill-engineering/)
│   ├── presentation-crafting/              ← Deck creation skill (content → slides)
│   └── presentation-template-creation/     ← Template-set authoring skill (catalogs, design systems, layouts)
├── presentation/
│   ├── templates/                          ← Versioned template sets (e.g. swiss-modern)
│   │   ├── template-system.md              ← Master template-system rules
│   │   └── slide-types-v1.md               ← Versioned slide-type catalog
│   ├── preview-app/                        ← Single shared React preview runtime (Vite)
│   └── working-files/{slug}/               ← One folder per deck: content/, source/, assets/, export/
├── update-logs/                            ← Dated change logs (see below)
├── plans/                                  ← Implementation plans & reports
└── docs/                                   ← Project documentation
```

## Way of Working (Presentation Crafting)

Activate the `presentation-crafting` skill for deck work (content → slides) and the `presentation-template-creation` skill for template-set or slide-type-catalog work. The skills are deliberately non-overlapping; never improvise either flow. Non-negotiable rules:

1. **One canonical Markdown content file per deck** (`working-files/{slug}/content/{slug}.slides.md`) — the source of truth for text, images, icons, speaker notes, and review annotations.
2. **One and only one template set per presentation.** Every slide derives from a declared slide type in the active slide-type catalog. No off-template improvisation.
3. **Templates are versioned** against the slide-types catalog version they implement.
4. **Overrides (layout/animation) are an explicit, recorded edge case** — justified in the content file, never the default flow.
5. **Icons:** icon-font approach, Phosphor-first (see skill's `icon-policy.md`).
6. **Animations:** gentle, attention-holding, from the approved preset vocabulary only.
7. **One shared preview runtime** (`presentation/preview-app/`) — never scaffold per-template or per-deck apps.
8. **Validate before handoff:** decks with `presentation-crafting/scripts/validate-slide-content.mjs`; templates with `presentation-template-creation/scripts/validate-template-manifest.mjs`.

## Karpathy Coding Guidelines

ALWAYS activate the `karpathy-guidelines` skill (`/karpathy-guidelines`) when writing, reviewing, or refactoring code. Core behaviors:

- **Don't overcomplicate** — write the simplest code that solves the actual problem; no speculative abstraction.
- **Surgical changes** — touch only what the task requires; preserve surrounding style and structure.
- **Surface assumptions** — state them explicitly instead of silently guessing.
- **Verifiable success criteria** — define how the change will be checked before writing it, then verify.

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
